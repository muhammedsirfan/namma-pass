// Approximate coordinates [lat, lng] for Bengaluru areas and tech parks (illustrative).
window.NP_DATA = {
  AREAS: {
    "HSR Layout": [12.9116, 77.6474],
    "Koramangala": [12.9352, 77.6245],
    "BTM Layout": [12.9166, 77.6101],
    "Bommanahalli": [12.9082, 77.6247],
    "Indiranagar": [12.9784, 77.6408],
    "Marathahalli": [12.9569, 77.7011],
    "Sarjapur Road": [12.9120, 77.6850],
    "KR Puram": [13.0075, 77.6960],
    "Whitefield": [12.9698, 77.7500],
    "Hebbal": [13.0358, 77.5970],
    "RT Nagar": [13.0210, 77.5950],
    "Yelahanka": [13.1007, 77.5963]
  },
  DESTS: {
    "Manyata Tech Park": [13.0475, 77.6203],
    "Embassy Tech Village (ORR)": [12.9370, 77.6960],
    "ITPL Whitefield": [12.9857, 77.7370],
    "Electronic City Phase 1": [12.8456, 77.6603]
  },
  // Which areas the simulated early registrants come from, per workplace.
  DEST_HOMES: {
    "Manyata Tech Park": ["Hebbal", "Yelahanka", "RT Nagar", "Indiranagar", "KR Puram"],
    "Embassy Tech Village (ORR)": ["HSR Layout", "Koramangala", "BTM Layout", "Bommanahalli", "Sarjapur Road", "Marathahalli", "Indiranagar"],
    "ITPL Whitefield": ["Marathahalli", "KR Puram", "Whitefield", "Indiranagar"],
    "Electronic City Phase 1": ["BTM Layout", "HSR Layout", "Bommanahalli", "Koramangala"]
  },
  NAMES: ["Anita", "Rahul", "Priya", "Karthik", "Meera", "Arjun", "Divya", "Suresh", "Lakshmi", "Vikram",
    "Neha", "Sanjay", "Deepa", "Imran", "Fathima", "Joseph", "Revathi", "Naveen", "Pooja", "Rohit",
    "Sneha", "Manoj", "Kavya", "Arun", "Nisha", "Faisal", "Swathi", "Ganesh", "Ananya", "Thomas"]
};
