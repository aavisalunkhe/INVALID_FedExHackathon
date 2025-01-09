from flask import Flask, request, jsonify
import requests as req
from flask_cors import CORS
from flask_cors import cross_origin

sourceLocation = '18.9067,72.8145'
endLocation = '19.1075,72.8828'
vehicleClass = 'Van'
fuelType = 'Diesel'
routePriority = 'Default'
FuelEfficiencyPenaltyFactor = 0.002
CargoWeight = 750

AverageWeight = {'Van': 3000, 'Truck': 7500}
AverageFuelEfficiency = {'Van': 15, 'Truck': 7}
EmissionFactor = {'Diesel': 2.65, 'Petrol': 2.35}

DefaultPriority = {'TravelTime': 1, 'TravelDistance': 2, 'TrafficDelay': 3, 'Emissions': 4, 'WeatherConditions': 5}
DefaultWeatherPriorityWeights = {'Precipitation': 0.5, 'Wind Speed': 0.333, 'Temperature': 0.167}

app = Flask(__name__)
CORS(app)
@app.route("/")
def index():
    return 'Index Page'
def getRoutes():
    payload = {'key': 'NYXIq2P7vjaGGK26Feu4r7esfl1aCKxj', 'routeRepresentation': 'polyline', 'traffic': 'true', 'travelMode': 'car', 'maxAlternatives': 2}
    r = req.get('https://api.tomtom.com/routing/1/calculateRoute/'+sourceLocation+':'+endLocation+'/json', params=payload)
    response = r.json()
    return response

def getWeatherData():
    payload = {'latitude': sourceLocation.split(',')[0], 'longitude': sourceLocation.split(',')[1], 'current': 'temperature_2m,precipitation,wind_speed_10m', 'timezone': 'auto'}
    r = req.get('https://api.open-meteo.com/v1/forecast', params=payload)
    response = r.json()
    weatherData = response.get("current", {})
    return weatherData

def scoreWeather():
    weatherData = getWeatherData()

    temperature = weatherData.get("temperature_2m")
    precipitation = weatherData.get("precipitation")
    WindSpeed = weatherData.get("wind_speed_10m")

    match temperature:
        case temperature if 15 <= temperature < 26:
            tempScore = 5
        
        case temperature if 26 <= temperature < 31:
            tempScore = 4
        
        case temperature if 31 <= temperature < 36:
            tempScore = 3
        
        case temperature if 36 <= temperature < 41:
            tempScore = 2
        
        case temperature if 41 <= temperature < 100:
            tempScore = 1
    
    match precipitation:
        case precipitation if 0.00 <= precipitation < 0.01:
            preciScore = 5
        
        case precipitation if 0.01 <= precipitation < 5:
            preciScore = 4
        
        case precipitation if 5.1 <= precipitation< 15:
            preciScore = 3
        
        case precipitation if 15.1 <= precipitation< 30:
            preciScore = 2
        
        case precipitation if 30 <= precipitation < 100:
            preciScore = 1
    
    match WindSpeed:
        case WindSpeed if 0 <= WindSpeed < 10:
            windScore = 5
        
        case WindSpeed if 10 < WindSpeed < 20:
            windScore = 4
        
        case WindSpeed if 20 < WindSpeed < 30:
            windScore = 3
        
        case WindSpeed if 30 < WindSpeed < 50:
            windScore = 2
        
        case WindSpeed if WindSpeed >= 51:
            windScore = 1
    
    weatherScore = (tempScore * DefaultWeatherPriorityWeights['Temperature']) + (preciScore * DefaultWeatherPriorityWeights['Precipitation']) + (windScore * DefaultWeatherPriorityWeights['Wind Speed'])
    round(weatherScore, 2)
    return weatherScore
        

def calculateRoute():
    match routePriority:
        case 'Eco':
            DefaultPriority = {'TravelTime': 2, 'TravelDistance': 3, 'TrafficDelay': 4, 'Emissions': 1, 'WeatherConditions': 5}
        
        case 'Distance':
            DefaultPriority = {'TravelTime': 2, 'TravelDistance': 1, 'TrafficDelay': 3, 'Emissions': 4, 'WeatherConditions': 5}
    
    response = getRoutes()
    processedRoutes = []
    RouteID = 0

    Legs = [leg for route in response.get("routes", []) for leg in route.get("legs", [])]

    for leg in Legs:
        
        RouteID += 1
        TravelDistance = round((leg["summary"].get("lengthInMeters"))/1000, 2)
        TravelTime = round((leg["summary"].get("travelTimeInSeconds"))/60, 2)
        TrafficDelay = round((leg["summary"].get("trafficDelayInSeconds"))/60, 2)
        

        points = leg.get("points", [])

        AdjustedFuelEfficiency = round(AverageFuelEfficiency[vehicleClass] - (FuelEfficiencyPenaltyFactor * CargoWeight), 2)
        FuelConsumption = round(TravelDistance / AdjustedFuelEfficiency, 2)
        Emissions = round(FuelConsumption * EmissionFactor[fuelType], 2)

        weatherScore = scoreWeather()

        route_data = {'RouteID': RouteID, 'TravelTime': TravelTime, 'TravelDistance': TravelDistance, 'TrafficDelay': TrafficDelay, 'Emissions': Emissions, 'WeatherConditions': weatherScore, "points": points}

        processedRoutes.append(route_data)
    
    return processedRoutes


def rankRoutes():
    processedRoutes = calculateRoute()

    def noramlize(values):
        min_val = min(values)
        max_val = max(values)
        return [(value - min_val) / (max_val - min_val) if max_val > min_val else 0 for value in values]
    
    max_priority = max(DefaultPriority.values())
    weights = {factor: (max_priority + 1 - priority) for factor, priority in DefaultPriority.items()}
    sum_weights = sum(weights.values())
    normalizedWeights = {factor: round(weight / sum_weights, 4) for factor, weight in weights.items()}
    
    factors = ['TravelTime', 'TravelDistance', 'TrafficDelay', 'Emissions', 'WeatherConditions']
    normalizedFactors = {factor: [round(value, 4) for value in noramlize([route[factor] for route in processedRoutes])] for factor in factors}


    for i, route in enumerate(processedRoutes):
        route['score'] = round(sum(normalizedFactors[factor][i] * normalizedWeights[factor] for factor in factors), 4)
    

    rankedRoutes = sorted(processedRoutes, key=lambda x: x['score'])
    for rank, route in enumerate(rankedRoutes, start=1):
        route['rank'] = rank
    
    return rankedRoutes

@app.route("/getformdata", methods=['GET', 'POST'])
@cross_origin()
def getFromData():
    if request.method== 'POST':
        global sourceLocation, endLocation, vehicleClass, routePriority, CargoWeight

        sourceLocation = request.json.get('source')
        endLocation = request.json.get('destination')
        vehicleClass = request.json.get('vehicle')
        routePriority = request.json.get('efficiency')
        CargoWeight = float(request.json.get('cargo'))
        print(sourceLocation, endLocation)
        
        rankedRoutes = rankRoutes()
        for route in rankedRoutes:
            route['points'] = [[point['latitude'], point['longitude']] for point in route['points']]
    
        return jsonify(rankedRoutes)

if __name__ == '__main__':
    app.run(debug=True)