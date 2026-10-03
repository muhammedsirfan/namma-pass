# Namma Pass

A prototype of a monthly shared commute pass for people who travel the same way every weekday, designed around Namma Yatri's zero-commission, direct-to-driver model.

**Live demo:** https://muhammedsirfan.github.io/namma-pass/
**Proposal:** [docs/NammaPass_Proposal.pdf](docs/NammaPass_Proposal.pdf)

## What you can try

The demo is a clickable app with a real map of Bengaluru and four views:

- **I'm a rider:** register a daily route (home, workplace, arrival time, vehicle, plan). The app finds 2 or 3 neighbours going the same way, shows pickup times on the map, one regular driver, and what you pay each month against a solo ride. A sparse route shows the waitlist instead, which is how a corridor opens.
- **I'm a driver:** see the group, the pickup order and the earnings with no commission. Mark a rider as on leave to see the route shorten while the fare is still paid.
- **I'm an employer:** see the monthly cost of covering a team's commute and how many vehicles come off the road.
- **About this idea:** the problem, the rules and what is simulated.

An older analyst view, `simulator.html`, runs 250 riders at once and shows totals.

## Run locally

No build step or dependencies. Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server 8000
```

Then visit http://localhost:8000. The map needs an internet connection.

## Project structure

```
index.html        the demo app
css/style.css     styles (light and dark)
js/data.js        Bengaluru areas, workplaces and simulated rider names
js/logic.js       matching and pricing (no DOM, can run in Node)
js/app.js         screens and map
simulator.html    analyst simulation of 250 riders
docs/             proposal PDF
```

## How matching and pricing work

- Riders going to the same workplace and arriving at the same time, living within 4 km, are grouped. A group needs at least 3 riders.
- Stops are ordered farthest first. A rider's extra travel time against a solo ride is capped at 15 minutes. If a group exceeds it, the farthest neighbour is dropped.
- The group pays 1.4 times the solo fare, split equally, and the driver collects all of it. That is about 35% of the solo fare each for 4 riders and 47% for 3.
- 3 and 6-month plans lock the seat price. They are not discounted.

## Assumptions

All other riders and the driver are simulated, and locations are approximate. Figures are illustrative.

- 18 km/h peak speed, road distance 1.3 times the straight line, 3 minutes wait per stop
- Solo fare = Rs 30 + Rs 8 per road km (to be replaced with a live fare engine)
- Driver subscription Rs 25 a day (auto) and Rs 90 a day (cab), from public reports
- 22 working days a month, 2 trips a day (44 trips)

This is an independent prototype, not an official Namma Yatri product.

## Author

Muhammed Sirfan C, [github.com/muhammedsirfan](https://github.com/muhammedsirfan), [linkedin.com/in/muhammedsirfan](https://linkedin.com/in/muhammedsirfan)

## License

MIT, see [LICENSE](LICENSE). Map data from OpenStreetMap contributors.
