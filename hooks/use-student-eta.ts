import { useEffect } from "react";
import { useMapsLibrary, useMap } from "@vis.gl/react-google-maps";
import { useSetRecoilState } from "recoil";
import { studentETA } from "../atoms/eta";

//@ts-ignore
export function useAutoUpdateETA(origin, destination) {
  const map = useMap();
  const routesAPI = useMapsLibrary("routes");
  const setEta = useSetRecoilState(studentETA);

  useEffect(() => {
    if (!map || !routesAPI || !origin || !destination) return;

    const service = new routesAPI.DirectionsService();
    console.log("DirectionsService initialized:", service);

    const fetchETA = async () => {
      try {
        const response = await service.route({
          origin,
          destination,
          travelMode: routesAPI.TravelMode.DRIVING,
          provideRouteAlternatives: false,
        });

        console.log("Route response:", response);

        if (response && response.routes && response.routes.length > 0) {
          const duration = response.routes[0].legs[0].duration?.text || null;
          const leg = response.routes?.[0]?.legs?.[0];
          console.log("ETA fetched:", duration);
          console.log("Leg details:", leg);
          setEta({
            value: leg?.duration?.value ?? null,
            status: leg ? "success" : "error",
          });
        } else {
          setEta({ value: null, status: "error" });
        }
      } catch (error) {
        console.error("Error fetching route:", error);
        setEta({ value: null, status: "error" });
      }
    };

    setEta({ value: null, status: "loading" });
    fetchETA();
    const interval = setInterval(fetchETA, 10000);

    return () => clearInterval(interval);
  }, [map, routesAPI, origin, destination, setEta]);
}
