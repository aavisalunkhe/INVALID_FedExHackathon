from flask import Flask, request, jsonify
import requests as req
from flask_cors import CORS, cross_origin
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Constants
TOMTOM_API_KEY = os.getenv('TOMTOM_API_KEY')
AVERAGE_WEIGHT = {'Van': 3000, 'Truck': 7500}
AVERAGE_FUEL_EFFICIENCY = {'Van': 15, 'Truck': 7}
EMISSION_FACTOR = {'Diesel': 2.65, 'Petrol': 2.35}
FUEL_EFFICIENCY_PENALTY_FACTOR = 0.002
DEFAULT_WEATHER_PRIORITY_WEIGHTS = {'Precipitation': 0.5, 'Wind Speed': 0.333, 'Temperature': 0.167}

@app.route("/")
def index():
    return 'Index Page'

def get_routes(source_location, end_location):
    if not TOMTOM_API_KEY:
         raise ValueError("TomTom API Key is missing")

    payload = {
        'key': TOMTOM_API_KEY,
        'routeRepresentation': 'polyline',
        'traffic': 'true',
        'travelMode': 'car',
        'maxAlternatives': 2
    }
    
    try:
        url = f'https://api.tomtom.com/routing/1/calculateRoute/{source_location}:{end_location}/json'
        r = req.get(url, params=payload)
        r.raise_for_status() 
        return r.json()
    except req.exceptions.RequestException as e:
        print(f"Error fetching routes: {e}")
        return {"routes": []}

def get_weather_data(location):
    try:
        lat, lon = location.split(',')
        payload = {
            'latitude': lat.strip(), 
            'longitude': lon.strip(), 
            'current': 'temperature_2m,precipitation,wind_speed_10m', 
            'timezone': 'auto'
        }
        r = req.get('https://api.open-meteo.com/v1/forecast', params=payload)
        r.raise_for_status()
        response = r.json()
        return response.get("current", {})
    except (ValueError, IndexError) as e:
        print(f"Invalid location format: {location}. Error: {e}")
        return {}
    except req.exceptions.RequestException as e:
        print(f"Error fetching weather data: {e}")
        return {}

def score_weather(weather_data):
    if not weather_data:
        return 0

    temperature = weather_data.get("temperature_2m", 25) # Default to a neutral temp if missing
    precipitation = weather_data.get("precipitation", 0)
    wind_speed = weather_data.get("wind_speed_10m", 10)

    # Temperature Scoring
    if 15 <= temperature < 26: temp_score = 5
    elif 26 <= temperature < 31: temp_score = 4
    elif 31 <= temperature < 36: temp_score = 3
    elif 36 <= temperature < 41: temp_score = 2
    else: temp_score = 1
    
    # Precipitation Scoring
    if 0.00 <= precipitation < 0.01: preci_score = 5
    elif 0.01 <= precipitation < 5: preci_score = 4
    elif 5.1 <= precipitation < 15: preci_score = 3
    elif 15.1 <= precipitation < 30: preci_score = 2
    else: preci_score = 1
    
    # Wind Speed Scoring
    if 0 <= wind_speed < 10: wind_score = 5
    elif 10 < wind_speed < 20: wind_score = 4
    elif 20 < wind_speed < 30: wind_score = 3
    elif 30 < wind_speed < 50: wind_score = 2
    else: wind_score = 1
    
    weather_score = (
        (temp_score * DEFAULT_WEATHER_PRIORITY_WEIGHTS['Temperature']) + 
        (preci_score * DEFAULT_WEATHER_PRIORITY_WEIGHTS['Precipitation']) + 
        (wind_score * DEFAULT_WEATHER_PRIORITY_WEIGHTS['Wind Speed'])
    )
    return round(weather_score, 2)

def calculate_route(source_location, end_location, vehicle_class, fuel_type, route_priority, cargo_weight):
    if route_priority == 'Eco':
        priority_weights = {'TravelTime': 2, 'TravelDistance': 3, 'TrafficDelay': 4, 'Emissions': 1, 'WeatherConditions': 5}
    elif route_priority == 'Distance':
        priority_weights = {'TravelTime': 2, 'TravelDistance': 1, 'TrafficDelay': 3, 'Emissions': 4, 'WeatherConditions': 5}
    else: # Default
        priority_weights = {'TravelTime': 1, 'TravelDistance': 2, 'TrafficDelay': 3, 'Emissions': 4, 'WeatherConditions': 5}

    response = get_routes(source_location, end_location)
    processed_routes = []
    
    # Pre-fetch weather once for the source location (simplification as per original code)
    # Ideally weather should be checked along key points, but original logic used one location check implied or globally.
    # Original 'scoreWeather' grabbed global 'sourceLocation'. 
    weather_data = get_weather_data(source_location)
    weather_score_val = score_weather(weather_data)

    route_id_counter = 0

    legs = [leg for route in response.get("routes", []) for leg in route.get("legs", [])]

    if not legs:
        return [], priority_weights

    for leg in legs:
        route_id_counter += 1
        travel_distance = round((leg["summary"].get("lengthInMeters", 0))/1000, 2)
        travel_time = round((leg["summary"].get("travelTimeInSeconds", 0))/60, 2)
        traffic_delay = round((leg["summary"].get("trafficDelayInSeconds", 0))/60, 2)
        points = leg.get("points", [])

        # Fuel Calculation
        avg_efficiency = AVERAGE_FUEL_EFFICIENCY.get(vehicle_class, 15)
        adjusted_fuel_efficiency = round(avg_efficiency - (FUEL_EFFICIENCY_PENALTY_FACTOR * cargo_weight), 2)
        
        # Avoid division by zero
        if adjusted_fuel_efficiency <= 0:
            adjusted_fuel_efficiency = 0.1
            
        fuel_consumption = round(travel_distance / adjusted_fuel_efficiency, 2)
        
        fuel_emission_factor = EMISSION_FACTOR.get(fuel_type, 2.65)
        emissions = round(fuel_consumption * fuel_emission_factor, 2)

        route_data = {
            'RouteID': route_id_counter, 
            'TravelTime': travel_time, 
            'TravelDistance': travel_distance, 
            'TrafficDelay': traffic_delay, 
            'Emissions': emissions, 
            'WeatherConditions': weather_score_val, 
            "points": points
        }

        processed_routes.append(route_data)
    
    return processed_routes, priority_weights

def normalize(values):
    if not values:
        return []
    min_val = min(values)
    max_val = max(values)
    if max_val == min_val:
        return [0 for _ in values] # Or 1? If all equal, score impact is null.
    return [(value - min_val) / (max_val - min_val) for value in values]

def rank_routes(source_location, end_location, vehicle_class, fuel_type, route_priority, cargo_weight):
    processed_routes, priority_weights = calculate_route(source_location, end_location, vehicle_class, fuel_type, route_priority, cargo_weight)

    if not processed_routes:
        return []

    max_priority = max(priority_weights.values())
    # Invert priority: Rank 1 is highest weight. 
    # Formula from original: (max + 1 - priority). 
    # If Priority 1 (Time), weight = 5 + 1 - 1 = 5. Highest weight.
    weights = {factor: (max_priority + 1 - priority) for factor, priority in priority_weights.items()}
    sum_weights = sum(weights.values())
    normalized_weights = {factor: round(weight / sum_weights, 4) for factor, weight in weights.items()}
    
    factors = ['TravelTime', 'TravelDistance', 'TrafficDelay', 'Emissions', 'WeatherConditions']
    
    # Extract values for normalization
    factor_values = {factor: [route[factor] for route in processed_routes] for factor in factors}
    normalized_factors = {factor: [round(val, 4) for val in normalize(values)] for factor, values in factor_values.items()}

    for i, route in enumerate(processed_routes):
        # Weighted Sum
        score = sum(normalized_factors[factor][i] * normalized_weights[factor] for factor in factors)
        route['score'] = round(score, 4)
    
    ranked_routes = sorted(processed_routes, key=lambda x: x['score'])
    for rank, route in enumerate(ranked_routes, start=1):
        route['rank'] = rank
    
    return ranked_routes

@app.route("/getformdata", methods=['GET', 'POST'])
@cross_origin()
def get_form_data():
    if request.method == 'POST':
        data = request.json
        source_location = data.get('source')
        end_location = data.get('destination')
        vehicle_class = data.get('vehicle', 'Van')
        route_priority = data.get('efficiency', 'Default')
        
        try:
            cargo_weight = float(data.get('cargo', 0))
        except (ValueError, TypeError):
            cargo_weight = 0

        # Note: Original code hardcoded 'Diesel'. 
        # Ideally this should also be an input or inferred from Vehicle Class.
        # Keeping default as Diesel for now to maintain parity.
        fuel_type = 'Diesel' 

        if not source_location or not end_location:
            return jsonify({'error': 'Source and Destination are required'}), 400
        
        print(f"Processing request: Source={source_location}, Dest={end_location}, Vehicle={vehicle_class}, Priority={route_priority}")

        ranked_routes = rank_routes(source_location, end_location, vehicle_class, fuel_type, route_priority, cargo_weight)
        
        # Format points for frontend
        for route in ranked_routes:
            route['points'] = [[point['latitude'], point['longitude']] for point in route['points']]
    
        return jsonify(ranked_routes)
    
    return jsonify({'message': 'Send a POST request with route details'})

if __name__ == '__main__':
    app.run(debug=True)
