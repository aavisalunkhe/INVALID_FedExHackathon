import React, { useState } from "react";
import { Box, Typography, TextField, Button, Select, MenuItem, List, ListItem } from "@mui/material";
import DirectionsCarOutlinedIcon from "@mui/icons-material/DirectionsCarOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import AirportShuttleOutlinedIcon from "@mui/icons-material/AirportShuttleOutlined";
import axios from 'axios';
import OptimRoute from "../optimRoute/optimRoute.jsx";

function HomePage() {
  const [vehicle, setVehicle] = useState("");
  const [source, setSource] = useState("");
  const [sourceSuggestion, setSourceSuggestion] = useState([]);
  const [destination, setDestination] = useState("");
  const [destinationSuggestion, setDestinationSuggestion] = useState([]);
  const [efficiency, setEfficiency] = useState("Default");
  const [cargo, setCargo] = useState("");
  const [routeData, setRouteData] = useState(null);
  const [isLoading, setLoading] = useState(false);

  const handleUseMyLocation = async function () {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async function (position) {
          const { latitude, longitude } = position.coords;
          try {
            const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
            setSource(response.data.display_name);
          } catch (error) {
            console.error("fetching location failed :|")
          }
        })
    } else {
      alert("geolocation error");
    }
  }

  const fetchSuggestion = async function (input, setSuggestion) {
    if (!input) {
      return setSuggestion([]);
    }
    try {
      const resp = await axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(input)}&format=json`)
      const suggest = resp.data.map((result) => {
        return result.display_name
      })
      setSuggestion(suggest);
    } catch (error) {
      console.error("fetching suggeestions failed :|");
    }
  }

  const handleVehicle = function (vehicle) {
    setVehicle(vehicle);
  }

  const fetchCoordinates = async (address) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json`);
      if (!response.ok) {
        throw new Error('Failed to fetch coordinates');
      }
      const data = await response.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
      } else {
        throw new Error("Unable to fetch coordinates for the given address");
      }
    } catch (error) {
      console.error("Error fetching coordinates:", error);
      throw error;
    }
  }

  const handleSubmit = async function (event) {
    console.log("Form submitted");
    event.preventDefault();
    setLoading(true);
    setRouteData(null);

    try {
      const sourceCoords = await fetchCoordinates(source);
      const destinationCoords = await fetchCoordinates(destination);
      const formData = {
        vehicle,
        source: `${sourceCoords.lat},${sourceCoords.lon}`,
        destination: `${destinationCoords.lat},${destinationCoords.lon}`,
        efficiency,
        cargo,
      }
      console.log(formData);
      const apiHost = import.meta.env.VITE_API_URL_HOST;
      const apiUrl = apiHost ? `https://${apiHost}` : (import.meta.env.VITE_API_URL || "http://localhost:5000");
      const response = await fetch(`${apiUrl}/getformdata`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      console.log("Response from backend:", result);
      setRouteData(result);

    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      display="flex"
      height="100vh"
    >
      <Box
        flex={1}
        padding={20}
        paddingTop={10}
        bgcolor="#f9f9f9"
        display="flex"
        flexDirection="column"
        justifyContent="center"
      >
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            color: "black",
            fontWeight: "bold",
          }}
        >
          Thank you for not going the Extra Mile :)
        </Typography>

        <Box
          component="form"
          onSubmit={handleSubmit}
          display="flex"
          flexDirection="column"
          gap={3}
          paddingTop="5%"
        >
          <Box
            display="flex"
            justifyContent="space-between"
            gap={2}
          >
            <Button
              onClick={function () {
                handleVehicle("Car")
              }}
              sx={{
                color: vehicle == "Car" ? "white" : "black",
                backgroundColor: vehicle === "Car" ? "black" : "transparent",
                border: "1px solid black",
                width: 100,
                height: 100,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                "&:hover": {
                  backgroundColor: "black",
                  color: "white",
                  "& .icon": {
                    display: "none",
                  },
                  "& .text": {
                    display: "block",
                  },
                },
                "& .text": {
                  display: "none",
                },
              }}
            >
              <DirectionsCarOutlinedIcon className="icon" />
              <Typography className="text">Car</Typography>
            </Button>

            <Button
              onClick={function () {
                handleVehicle("Van")
              }}
              sx={{
                color: vehicle == "Van" ? "white" : "black",
                backgroundColor: vehicle === "Van" ? "black" : "transparent",
                border: "1px solid black",
                width: 100,
                height: 100,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                "&:hover": {
                  backgroundColor: "black",
                  color: "white",
                  "& .icon": {
                    display: "none",
                  },
                  "& .text": {
                    display: "block",
                  },
                },
                "& .text": {
                  display: "none",
                },
              }}
            >
              <AirportShuttleOutlinedIcon className="icon" />
              <Typography className="text">Van</Typography>
            </Button>

            <Button
              onClick={function () {
                handleVehicle("Truck")
              }}
              sx={{
                color: vehicle == "Truck" ? "white" : "black",
                backgroundColor: vehicle === "Truck" ? "black" : "transparent",
                border: "1px solid black",
                width: 100,
                height: 100,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                "&:hover": {
                  backgroundColor: "black",
                  color: "white",
                  "& .icon": {
                    display: "none",
                  },
                  "& .text": {
                    display: "block",
                  },
                },
                "& .text": {
                  display: "none",
                },
              }}
            >
              <LocalShippingOutlinedIcon className="icon" />
              <Typography className="text">Truck</Typography>
            </Button>
          </Box>
          {/*source section structure: flex box-> textfield(-> get the suggestions-> display in a list)
          ke side pe ek button for location(-> get the location)*/}
          <Box
            position="relative"
            display="flex"
            flexDirection="column"
            gap={3}
            paddingTop="5%"
          >
            <Box>
              <TextField
                label="Source"
                variant="outlined"
                fullWidth
                value={source}
                onChange={function (e) {
                  setSource(e.target.value);
                  fetchSuggestion(e.target.value, setSourceSuggestion);
                }}
                InputLabelProps={{
                  style: {
                    color: "black",
                  },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "black",
                    },
                    "&:hover fieldset": {
                      borderColor: "black",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "black",
                    },
                  },
                }}
              />
              <Button
                onClick={handleUseMyLocation}
                sx={{
                  position: "absolute",
                  top: "5px",
                  right: "10px",
                  backgroundColor: "black",
                  color: "white"
                }}
              >
                Use My Location
              </Button>
              {sourceSuggestion.length > 0 && (
                <List
                  sx={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    width: "100%",
                    maxHeight: 150,
                    overflowY: "auto",
                    backgroundColor: "white",
                    border: "1px solid black",
                    zIndex: 10,
                    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)"
                  }}
                >
                  {sourceSuggestion.map((suggestion, index) => (
                    <ListItem
                      button="true"
                      key={index}
                      onClick={() => {
                        setSource(suggestion);
                        setSourceSuggestion([]);
                      }}
                    >
                      {suggestion}
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </Box>

          <Box position="relative">
            <TextField
              label="Destination"
              variant="outlined"
              fullWidth
              value={destination}
              onChange={function (e) {
                setDestination(e.target.value)
                fetchSuggestion(e.target.value, setDestinationSuggestion)
              }}
              InputLabelProps={{
                style: {
                  color: "black",
                },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "black",
                  },
                  "&:hover fieldset": {
                    borderColor: "black",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "black",
                  },
                },
              }}
            />
            {destinationSuggestion.length > 0 && (
              <List
                sx={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  width: "100%",
                  maxHeight: 150,
                  overflowY: "auto",
                  backgroundColor: "white",
                  border: "1px solid black",
                  zIndex: 10,
                  boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)"
                }}
              >
                {destinationSuggestion.map((suggestion, index) => (
                  <ListItem
                    button="true"
                    key={index}
                    onClick={() => {
                      setDestination(suggestion);
                      setDestinationSuggestion([]);
                    }}
                  >
                    {suggestion}
                  </ListItem>
                ))}
              </List>
            )}
          </Box>

          <TextField
            label="Cargo Weight in Kgs"
            variant="outlined"
            fullWidth
            value={cargo}
            onChange={function (e) {
              setCargo(e.target.value)
            }}
            InputLabelProps={{
              style: {
                color: "black",
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: "black",
                },
                "&:hover fieldset": {
                  borderColor: "black",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "black",
                },
              },
            }}
          />

          <Select
            value={efficiency}
            onChange={function (e) {
              setEfficiency(e.target.value)
            }}
            fullWidth
            sx={{
              color: "black",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "black",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "black",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "black",
              },
            }}
          >
            <MenuItem value="Eco">Energy-Efficient</MenuItem>
            <MenuItem value="Default">Time-Efficient</MenuItem>
            <MenuItem value="Distance">Distance-Efficient</MenuItem>
          </Select>

          <Button
            variant="contained"
            size="large"
            type="submit"
            sx={{
              backgroundColor: "black",
              "&:hover": {
                backgroundColor: "gray",
              },
            }}
          >
            Check Routes
          </Button>
        </Box>
      </Box>
      <Box
        flex={2}
        position="relative"
        padding={5}
        alignItems={"center"}
        justifyContent="center"
      >
        <OptimRoute
          routeData={routeData}
          isLoading={isLoading}
        />

      </Box>
    </Box>
  )
}

export default HomePage;
