import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { CircularProgress, Typography } from "@mui/material";
import axios from "axios";

function OptimRoute({routeData, isLoading}){
  //1. user freshly comes: sees an empty map 
  //2. fills form, clicks check routes: loading with animation 
  //3. backend returns routeData: leaflet plots and returns map

  useEffect(() => {
  if (routeData) {
    console.log("Received route data in OptimRoute:", routeData);
  }
  }, [routeData]);

  const getMidpoint = (coords) => {
    let latSum = 0;
    let lngSum = 0;
    coords.forEach(([lat, lng]) => {
      latSum += lat;
      lngSum += lng;
    });
    return [latSum / coords.length, lngSum / coords.length];
  };

  let content;
  
  if( isLoading){
    content= (
      <div style= {{ 
        textAlign: "center",
        marginTop: "20%" 
        }}
      >
        <CircularProgress
          color= "inherit" 
        />
        <Typography
          variant="body1"
        >
          Loading route...
        </Typography>
      </div>
    );
  //routeData is null, default, no input to the backend condition (1)
  }else if(routeData=== null){

    content= (
      <MapContainer
        center= {[0, 0]}
        zoom= {2}
        style= {{
          height:"80vh",
          width:"100%",
        }}
      >
        <TileLayer
          attribution= "&copy; OpenStreetMap contributors"
          url= "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      </MapContainer>
    );
  //routeData mai there's some data (3)
  }else{
    const primaryRoute = routeData[0];
    const otherRoutes = routeData.slice(1);
    const primaryRouteCenter = getMidpoint(primaryRoute.points);
    const otherRouteCenters = otherRoutes.map((route) => getMidpoint(route.points));
    const centerPoint = primaryRouteCenter || [0, 0];

    content= (
      <MapContainer
        center={centerPoint}
        zoom={12}
        style={{
          height:"80vh",
          width:"100%",
        }}
      >
        <TileLayer
          attribution= "&copy; OpenStreetMap contributors"
          url= "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline
          positions= {primaryRoute.points}
          color= "blue"
        >
          <Marker position={primaryRouteCenter}>
          <Popup position={primaryRouteCenter}>
            <div>
              <h4>Route {primaryRoute.RouteID} - Rank: {primaryRoute.rank}</h4>
              <p>Emissions: {primaryRoute.Emissions} kg CO2</p>
              <p>Traffic Delay: {primaryRoute.TrafficDelay} mins</p>
              <p>Travel Distance: {primaryRoute.TravelDistance} km</p>
              <p>Travel Time: {(primaryRoute.TravelTime / 60).toFixed(2)} hrs</p>
              <p>Weather Conditions: {primaryRoute.WeatherConditions}</p>
              <p>Score: {primaryRoute.score}</p>
            </div>
          </Popup>
          </Marker>
        </Polyline>
        {otherRoutes.map((route, index)=> (
          <Polyline 
            key={index}
            positions={route.points}
            color="grey"
          >
            <Marker position={otherRouteCenters[index]}>
            <Popup position={otherRouteCenters[index]}>
              <div>
                <h4>Route {route.RouteID} - Rank: {route.rank}</h4>
                <p>Emissions: {route.Emissions} kg CO2</p>
                <p>Traffic Delay: {route.TrafficDelay} mins</p>
                <p>Travel Distance: {route.TravelDistance} km</p>
                <p>Travel Time: {(route.TravelTime / 60).toFixed(2)} hrs</p>
                <p>Weather Conditions: {route.WeatherConditions}</p>
                <p>Score: {route.score}</p>
              </div>
            </Popup>
            </Marker>
          </Polyline>
        ))}
      </MapContainer>
    );
  }
  return(
  <div 
    style= {{
      height: "100vh",
      width: "100%" 
    }}
  >
    {content}
  </div>
)}

export default OptimRoute;
