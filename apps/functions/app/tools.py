from app.schemas import Coordinates, Mood, RouteObject, RouteStop


GOA_ROUTE = [
    Coordinates(lat=15.4909, lng=73.8278),
    Coordinates(lat=15.5100, lng=73.7900),
    Coordinates(lat=15.5568, lng=73.7519),
    Coordinates(lat=15.5738, lng=73.7350),
    Coordinates(lat=15.6013, lng=73.7385),
]


def route_for_mood(mood: Mood, disruption: str | None = None) -> RouteObject:
    if disruption == "rain_event":
        return RouteObject(
            name="Indoor recovery route",
            polyline=[
                Coordinates(lat=15.4909, lng=73.8278),
                Coordinates(lat=15.5200, lng=73.8000),
                Coordinates(lat=15.5738, lng=73.7350),
                Coordinates(lat=15.6013, lng=73.7385),
            ],
            eta_minutes=22,
            distance_km=10.1,
            risk_score=0.24,
            stops=[
                RouteStop(name="Panaji City Centre", coords=Coordinates(lat=15.4909, lng=73.8278), kind="origin"),
                RouteStop(name="Infantaria Cafe, Anjuna", coords=Coordinates(lat=15.5738, lng=73.7350), kind="indoor"),
                RouteStop(name="Vagator Beach", coords=Coordinates(lat=15.6013, lng=73.7385), kind="destination"),
            ],
        )

    label = {
        Mood.adventure: "Adventure trail",
        Mood.relaxed: "Low-energy scenic route",
        Mood.nightlife: "Nightlife operations route",
        Mood.budget: "Budget-efficient route",
        Mood.photography: "Photography viewpoint route",
        Mood.social: "Group-friendly route",
    }[mood]
    return RouteObject(
        name=label,
        polyline=GOA_ROUTE,
        eta_minutes=28 if mood != Mood.relaxed else 34,
        distance_km=12.4,
        risk_score=0.31,
        stops=[
            RouteStop(name="Panaji City Centre", coords=Coordinates(lat=15.4909, lng=73.8278), kind="origin"),
            RouteStop(name="Tito's Lane, Baga", coords=Coordinates(lat=15.5568, lng=73.7519), kind="poi"),
            RouteStop(name="Curlies, Anjuna", coords=Coordinates(lat=15.5738, lng=73.7350), kind="poi"),
            RouteStop(name="Vagator Beach", coords=Coordinates(lat=15.6013, lng=73.7385), kind="destination"),
        ],
    )


def weather_risk_for_event(disruption: str | None) -> int:
    return 82 if disruption == "rain_event" else 20

