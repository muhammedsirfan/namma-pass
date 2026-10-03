# Namma Pass

A prototype of a peak-hour shared commute subscription, designed around Namma Yatri's zero-commission, direct-to-driver model.



## What it does

Simulated riders travel from five Bengaluru areas to a tech park on the Outer Ring Road between 7:00 and 10:00. The app:

- groups riders by home proximity and pickup time (within 15 minutes), in groups of 3 (auto) or 4 (cab)
- checks every rider's extra travel time against an adjustable cap (default 15 minutes) and waitlists riders it cannot place
- splits the fare so the group pays 1.4 times the solo fare and the driver collects all of it, with no commission
- shows each rider's monthly bill, with an optional employer-paid share, and the driver's net earnings per peak day against solo rides


## Assumptions

All riders are synthetic and the geography is simplified. Figures are illustrative.

- 18 km/h peak speed, 1.3 road factor, 3 minutes wait per stop
- Solo fare = Rs 30 + Rs 8 per road km (to be replaced with a live fare engine)
- Seat price = 1.4 / riders x solo fare (35% in a group of 4, about 47% in a group of 3)
- Driver subscription Rs 25 a day (auto) and Rs 90 a day (cab), from public reports
- 22 working days a month, 2 trips a day (44 trips)


