# Last Dash

Last Dash is a short third-person 3D browser game about speed, maneuvering space, and route correction under moving threats. The project was created for **Game Design from Everyday Life**.

## Run the published build

The repository root contains the verified static build used by GitHub Pages.

1. Start any static HTTP server in the repository root. For example: `python -m http.server 4173`
2. Open `http://127.0.0.1:4173/`.
3. Select **Play game** and choose a challenge.

Opening the HTML files directly is not supported because the game uses JavaScript modules.

## Controls

| Input | Action |
| --- | --- |
| Mouse | Unlimited yaw and pitch; click the flight view to capture the mouse |
| `W` / `S` | Accelerate forward / backward along the drone's facing |
| `A` / `D` | Strafe left / right |
| `Q` / `E` | Roll left / roll right around the forward axis |
| `Space` / `Ctrl` | Rise / descend vertically |
| `Shift` | Short boost along the current facing; must recharge |
| `R` | Restart the current challenge |
| `Esc` | Release held input |

## Core rules

- The drone starts stationary and never advances automatically. Releasing translation controls lets drag slow it into a hover without changing its orientation.
- Translation and orientation are independent: the drone can face any direction while moving sideways, vertically, backward, or not at all.
- High velocity lowers rotational authority and increases the space required to correct the route.
- Tanks and anti-air vehicles each have a visible radius and their own continuous 0.8-second lock timer. Leaving a radius resets that unit's lock. Completed lock fires visible, moving cannon rounds; an actual projectile hit destroys the drone.
- Anti-air vehicle radii are approximately 20% larger: 36–40 / 35–41 / 32–35 metres across the three presets. Red cylindrical volumes extend four metres into the sky layer, including at their outer edges, so there is no untracked vertical gap above their ground footprint. Tank radii remain spherical.
- Above the overhead amber grid (27 / 26 / 24 metres for the three presets), a separate 2-second continuous lock launches a guided missile. Its height follows defense coverage rather than roof height. Descending cancels acquisition but does not erase missiles already launched. Solid buildings intercept projectiles.
- Any direct contact with the moving tank succeeds. There is no minimum impact speed; a fast approach reduces the time spent inside its defense radius.
- Drone destruction and tank hits trigger particle fire, sparks, expanding smoke, shockwaves, and tumbling model fragments. Results appear after a 1.9-second effects window.
- Missing the target does not create an arbitrary instant failure; the player can adjust and try another approach.

## Challenge presets

1. **Open-Space Intercept:** three moving defense vehicles, no physical obstacles, and generous maneuvering space.
2. **Restricted Approach:** four moving defenses and solid obstacles make the direct route unsafe.
3. **Urban Intercept:** five moving defenses and dense buildings create narrow corridors and overlapping spatial pressure.

The presets change environment geometry, boundary size, target path and speed, threat count, threat radius, and skyline height.

## Main variables

| System | Main variables |
| --- | --- |
| Drone | position, 3D velocity, quaternion orientation, local forward/right/up axes, rotational authority, boost charge |
| Target | path points, path progress, movement speed, defense radius, independent lock exposure |
| Threat | position, movement path, radius, movement speed, lock exposure, firing cooldown |
| Lock | per-unit ground exposure `0–0.8s`, separate sky exposure `0–2s`, sky altitude |
| Projectile | position, direction, velocity, lifetime, homing turn rate, swept collision |
| Level | boundary, spawn point, obstacles, threats, target configuration |
| Game | select, playing, resolving, won, failed |

## Dependency track

This project uses **Track C: npm + Vite** because meaningful 3D navigation is central to the design.

- Three.js `0.185.1`, MIT License
- Vite `8.2.2`, MIT License
- Node.js `20.19.0` or newer
- Build command: `npm run build`
- Intermediate output: `dist/`
- Published output: `index.html`, `game.html`, `process.html`, and `assets/` in the repository root

Dependencies are pinned in `source/package.json` and `source/package-lock.json`. `node_modules` is excluded from version control. All runtime assets are local; the site does not use a CDN.

## Source and publishing

Editable site and game source lives under `source/`. The build script runs Vite with `base: './'`, then copies the verified static output to the repository root. This keeps every internal link and asset path compatible with a GitHub Pages repository subpath.

The student brief is `Last-Dash.md`. The hand-drawn system graph is `system-graph.png`, and the human–AI timeline is maintained in `development-log/agent-development-log.md`.

## GitHub Pages

The workflow at `.github/workflows/pages.yml` publishes `index.html`, `game.html`, `process.html`, and `assets/` whenever `main` is updated. All internal URLs remain relative, so the game works from a GitHub repository subpath.

## Models and effects

Student-supplied originals are preserved in `models/`. `npm run prepare:models` (also run by the build) converts all eight FBX files into indexed GLB models under `source/public/assets/models/`. Four building sets become eleven individual building variants. Same-material parts are merged and model geometry is shared between instances. The drone's referenced `Image_*` texture files were absent, so it uses replacement local PBR materials; no missing texture URLs are fetched.

The particle system caps allocation at 2,400 particles, reuses its geometry buffers, and clears debris and projectiles on restart. Model fragments share the original model geometry. Runtime assets are local and require no new dependencies. Run `npm test` from `source/` for lock-timing and swept-collision regression checks.
