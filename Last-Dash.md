# First Playable Web Game Brief

> This summary and the accompanying system graph are the two primary development references. Build from both. If they conflict, preserve the learning goal and ask the student before changing the core design.

## 1. Project Identity
- Student / Team: Yizhou Zhang
- Project Title: Last Dash
- Domain: 3D drone control and spatial navigation in a dynamic threat environment.
- Tool / AI Agent: CodeX or Zcode

## 2. Design Summary
**Domain and real experience:** 3D drone piloting and spatial navigation under dynamic threats, presented as an arcade-style anti-armor FPV drone simulator.

I became interested after seeing footage from the Russia–Ukraine war showing FPV drones navigating through heavy defensive threats. The combination of risk, movement, and fast decision-making also fits video game design well.

**Novice misconception:** Beginners often believe that a short, fast, direct route is always the best option, even when it passes through dangerous or difficult areas.

**Most important domain challenge:** current design: Space. The main challenge is navigating limited 3D space while avoiding moving threat zones and obstacles and approaching a moving target. As the environment becomes more crowded, the player has less safe space to maneuver and must fly more precisely.

Beginners often commit to a direct, high-speed approach too early. They leave too little room to turn, avoid threats, or correct their final approach to the moving target.

**Core learning shift:** Beginners think success means flying directly and quickly toward the target; experts know it means managing speed, space, and changing threats so they always preserve enough room to maneuver and correct their approach.

## 3. Core Player Learning Loop
**Observe:** The player needs to observe how much space they have to maneuver, where moving threat zones and obstacles are, how fast they are flying, and how the target is moving so they can continuously adjust their approach.

**Judge:** The player needs to judge when to speed up or slow down, whether they have enough space to turn or evade, when to leave a threat zone, and how to adjust their path to intercept the moving target.

**Act:** The player can accelerate or slow down, turn, climb or descend, change their route to avoid obstacles and threat zones, and adjust their final approach to intercept the moving target.

**Read feedback:** The system gives feedback through visible threat zones, lock-on progress, warning sounds, speed indicators, target markers, and immediate collision or interception results.

**Adjust:** The player can change speed, altitude, direction, or route based on nearby threats, available space, lock-on progress, and the target’s movement.

**Ability improved through repetition:** The player becomes better at controlling speed, preserving maneuvering space, reacting to moving threats, and timing a precise approach to a moving target.

## 4. Data Model for the System Graph

### Environment Data
- The player needs to observe how much space they have to maneuver, where moving threat zones and obstacles are, how fast they are flying, and how the target is moving so they can continuously adjust their approach.

### Player-Controlled Data
- The player can accelerate or slow down, turn, climb or descend, change their route to avoid obstacles and threat zones, and adjust their final approach to intercept the moving target.

### System-Calculated Results
- The system gives feedback through visible threat zones, lock-on progress, warning sounds, speed indicators, target markers, and immediate collision or interception results.

### Feedback Translation
- The signal comes from the drone’s movement response. It tells the player whether they are flying at a controllable speed and still have enough ability to turn or correct their path. In the game, high speed causes wider turns, slower directional response, and stronger momentum, while lower speed gives the player more precise control.
- The signal comes from enemy threat zones. It tells the player how close they are to being intercepted and whether they need to leave the danger area immediately. In the game, it appears as an increasing lock-on bar, flashing warning indicators, and faster warning sounds as the lock becomes stronger.
- The signal comes from the surrounding environment, including obstacles, threat-zone boundaries, and the target’s movement. It tells the player whether they still have enough space to turn, evade, or correct their approach. In the game, this appears through visible 3D threat zones, nearby buildings or obstacles, and the target marker showing its changing position.

## 5. Challenge Space
**Challenge factors (affecting player-controlled data):** Acceleration / deceleration ←
- Available space
- Nearby obstacles
- Threat-zone location
- Distance to target
- Target movement
Steering direction ←
- Obstacle placement
- Moving threat zones
- Map boundaries
- Target direction
- Current speed / momentum
Climb / descent ←
- Building height
- Vertical obstacle placement
- Threat-zone volume
- Map altitude limits
Chosen route ←
- Threat-zone positions
- Moving defense units
- Obstacle density
- Target movement
- Remaining safe space

**Factors that force a new judgment:** Threat-zone position, obstacle density, available maneuvering space, target movement, and current speed force the player to change judgment. A route that is safe at low speed may become dangerous at high speed, while a previously open route may become blocked by a moving threat zone or obstacle.

**Perceivable vs inferred factors:** Directly perceived:
- Visible threat-zone boundaries
- Obstacles and buildings
- Target marker and position
- Lock-on warning
- Current speed
- Map boundaries
Gradually inferred:
- How speed affects turning ability
- How much room is needed to safely change direction
- When it is better to slow down before entering a confined area
- How early the player must adjust their path to intercept a moving target
- How different threat and obstacle combinations reduce usable space

**Challenge dimension table:** For 2-3 key factors, list an “easy state” and a “hard state”
1. Available Maneuvering Space
Easy state:
Large open area with few obstacles and wide gaps between threat zones.
Judgment learned:
Basic steering and route correction.
Hard state:
Narrow city streets, nearby buildings, and overlapping moving threat zones.
Judgment learned:
How much space is required to turn, evade, and recover without crashing.
2. Drone Speed
Easy state:
Moderate speed with enough open space to correct mistakes.
Judgment learned:
Basic relationship between speed and control.
Hard state:
High speed inside a narrow or obstructed area.
Judgment learned:
When to slow down before turning and when acceleration is worth the loss of control.
3. Threat Density
Easy state:
One isolated moving threat zone with plenty of room to leave it.
Judgment learned:
Recognize the warning and escape before lock-on completes.
Hard state:
Several moving threat zones combined with buildings and limited escape paths.
Judgment learned:
Choose an escape direction while preserving enough space for the next maneuver.

**2-3 progressive challenge combinations:** Challenge 1 — Open-Space Intercept
Factor combination:
Open space + one or few moving threat zones + moving target
Concrete situation:
The player crosses an open map, avoids entering a moving danger zone for too long, and then aligns with the moving target.
Skill it trains:
Basic flight control, speed management, lock-on awareness, and target interception.
Challenge 2 — Restricted Approach
Factor combination:
More threat zones + moderate obstacles + moving target
Concrete situation:
The direct route becomes unsafe, so the player must adjust speed and direction while passing between obstacles and moving danger areas.
Skill it trains:
Precise steering, route correction, and preserving maneuvering space.
Challenge 3 — Urban Intercept
Factor combination:
Dense obstacles + moving threat zones + narrow maneuvering space + moving target
Concrete situation:
The player must fly through a city environment where buildings restrict turning space while moving danger zones continuously change which routes are safe.
Skill it trains:
Advanced spatial judgment, speed control, evasive movement, and final approach timing.

**Simple-to-complex sequence:** Yes. The challenges progress from basic flight and threat awareness in open space, to combining threats with obstacles, and finally to managing speed, moving threats, dense obstacles, and a moving target at the same time in restricted urban space. Each level adds spatial complexity without changing the game’s core controls.

**What failure teaches next:** Yes. The cause of failure should be clearly communicated through immediate feedback. A collision shows that the player misjudged available space, interception shows that they stayed inside a threat zone too long, and missing the target shows that their speed or final approach was poorly aligned. This helps the player understand what to watch and adjust on the next attempt.

## 6. Visual & Camera
**Camera perspective:** Third-person follow camera.

**Why this perspective fits the learning shift:** A third-person follow camera lets the player see both the drone and the space around it. This makes speed, turning room, obstacles, threat zones, and the target’s movement easier to judge at the same time, supporting the shift from simply flying toward the target to managing space and maneuverability.

**2D / 2.5D / 3D:** 3D.

**Visual style:** Stylized low-poly / minimal 3D geometry. The environment should be readable rather than realistic, with clear silhouettes for buildings, vehicles, obstacles, targets, and threat zones.

**Color tone:** Mostly cool and slightly dark, with high-contrast warning colors for danger zones, lock-on indicators, and the target marker. This creates tension while keeping important gameplay information easy to read.

**Sound:** The main sounds are drone motor noise, speed-related wind sound, collision impact, lock-on warning beeps that become faster as danger increases, and a clear target-impact sound. Music should be tense but minimal so that warning sounds remain easy to hear.

## 7. AI Collaboration Boundary
**Student-owned decisions (AI must not change):** The core flight mechanic, third-person 3D perspective, speed-versus-maneuverability relationship, visible moving threat zones, lock-on system, moving target, collision-based success condition, failure conditions, and the three-level progression from open space to dense urban space must remain fixed. The core learning shift—managing speed and available maneuvering space instead of simply flying directly toward the target—must also remain unchanged.

**AI-autonomous decisions:** The AI may decide technical implementation details, code structure, exact geometry and placement of decorative objects, visual effects, UI polish, sound implementation, animation details, and minor balancing values such as movement speed, lock-on timing, or obstacle spacing, as long as these changes preserve the core mechanics and learning goals.

**How to detect and pull back a generic game:** I will check whether success still depends on managing speed, maneuvering space, moving threat zones, and a moving target. If the game can be completed mainly by flying straight toward the target, memorizing a fixed route, or simply avoiding static obstacles, then the design has become too generic. I would pull it back by restoring the speed–maneuverability trade-off, dynamic threat zones, restricted space, and the need for continuous route correction.

## 8. Rules, Boundaries, and Outcomes
**Important states:** The drone can be in controllable or difficult-to-control states, the player can be safe, detected, locking, or intercepted, and the approach to the target can be stable or unstable. The surrounding space can also be considered open, restricted, or blocked.

**How player actions change the system:** Accelerating and slowing down change speed and maneuverability. Turning, climbing, and descending change position, altitude, and distance from threats or obstacles. Changing direction can move the player out of a threat zone and reduce lock-on progress, while approaching the target changes the final interception state.

**Success condition:** The player succeeds by reaching and accurately colliding with the marked moving target while maintaining enough speed for a successful final approach, without being intercepted or crashing into the environment.

**Failure conditions:** The player fails if the drone is intercepted after remaining inside a threat zone for too long, crashes into the ground or an obstacle, misses the moving target during the final approach, or approaches the target too slowly and is defeated by its close-range defense.

**Just-right ranges and thresholds:** Yes. The player needs to maintain a useful speed range: flying too slowly makes the drone vulnerable and wastes time inside threat zones, while flying too fast reduces maneuverability and makes obstacles and final corrections much harder. The ideal speed depends on the available space and the current threat situation.

## 9. Feedback Priorities
**Immediate feedback:** Immediate feedback should include the drone’s movement response, current speed, visible threat-zone boundaries, lock-on warnings, nearby obstacles, and the target marker. These signals help the player react quickly to immediate danger and control problems.

**Feedback discovered over time:** The relationship between speed and maneuverability should be learned gradually. The game does not need to explicitly tell the player that high speed reduces their ability to turn; they should discover this through repeated attempts, especially when approaching obstacles or making final corrections.

**Feedback that must be visual, spatial, audible, or state-based:** Lock-on danger, maneuverability, and available space should be communicated through sound, movement feel, visual warning effects, and environmental changes rather than only through numerical values. For example, lock-on warnings become faster and louder, and high-speed flight produces wider turns and stronger momentum.

## 10. First Playable Version Scope
- Build a small desktop-browser game that validates one complete observe → judge → act → feedback → adjust loop.
- Use the accompanying system graph to implement 2-3 challenge presets when they are clearly defined. Each challenge should change system variables or relationships, not only visual decoration.
- Keep graphics simple and readable. Prioritize interaction, feedback, and learning over polish.
- Do not add realistic simulation, complex menus, accounts, online multiplayer, large asset pipelines, or unrelated features in the first version.
- Do not convert the project into a generic mini-game that only uses the domain as a theme.

## 11. Web Game Technical Dependencies and GitHub Pages

This project is published as a GitHub Pages site. The published site IS the exhibition. There is no ZIP packaging step and no separate offline build.

### GitHub Pages Publishing Rules
- The site is served from the repository root on the `main` branch, at `https://<username>.github.io/<repository-name>/`.
- Because GitHub Pages serves the site from a subpath, **every internal link and every asset path must be relative**. Root-absolute paths beginning with `/` will break on the published site even when they work locally.
- Store all required models, textures, audio, fonts, and libraries inside the repository. Do not load them from a CDN or another remote service.
- The repository is public. Never commit passwords, tokens, API keys, or personal information the student has not agreed to publish.
- After every push, the site republishes automatically. Verify the live URL, not only the local server.

### Choose the Lowest Necessary Dependency Track
1. **Track A - No build step:** Prefer HTML, CSS, plain JavaScript, and Canvas 2D for simple 2D games. This is the default choice and needs no extra configuration.
2. **Track B - Local vendored library:** For one small browser library, pin its version and store it under `assets/vendor/`.
3. **Track C - npm + build tool:** Use npm and Vite only for Three.js, multiple ES Modules, loaders, or other complex dependency graphs.

### Three.js and Vite Rules
- Three.js is allowed when 3D is important to the designed experience; do not replace meaningful 3D interaction only to avoid npm.
- Pin dependency versions in `package.json` and preserve `package-lock.json`.
- Configure Vite with a relative base such as `base: './'` so built assets work under the Pages subpath.
- Run `npm run build`, then copy the verified static output into the repository root so GitHub Pages serves it.
- Add a `.gitignore` that excludes `node_modules`. Never commit `node_modules`.
- Record dependency names, exact versions, licenses, build command, and output directory in `README.md`.

### Expected Repository Structure
```text
repository/
├── index.html                 # Project home: designer statement, system graph, play link
├── game.html                  # Playable game (or game/index.html)
├── process.html               # Human-AI development timeline
├── assets/                    # JS/CSS, system graph image, models, textures, audio, fonts
├── development-log/
│   └── agent-development-log.md
├── brief.md                   # This design and development specification
├── system-graph.png
├── ratings.csv                # Exported question-clarity ratings (teaching feedback)
├── README.md                  # How to run, controls, dependency track, main variables
└── source/                    # Track C only: src/, package.json, package-lock.json
```

## 12. Integrated Project Website Requirements
The website is the project space, not a final report and not a separate marketing page. It must exist from the first milestone and stay current as development progresses.

### Website From Day One
- Create the first version of `index.html` in the same pass as the first playable demo. Do not defer the website to the end of the project.
- The website is the exhibition surface: classmates and visitors will read it before or instead of playing, so it carries the designer statement, the system graph, and the play link.
- When the design changes, the website changes with it. A website that describes an older version of the game is worse than no website.

### Required Website Content
- **Game Idea:** project title, short concept, player goal, and core learning shift.
- **Domain Knowledge:** explain the real-world domain, novice misconception, expert judgment, and why this knowledge becomes playable.
- **System Design:** show the system graph and summarize environment data, player-controlled data, calculated results, feedback, success, failure, and challenge presets.
- **Development Process:** present a concise chronological timeline based on `agent-development-log.md`, including important changes, failures, tests, student decisions, and AI influence.
- **Play the Game:** the current playable version must be accessible from clear navigation and run directly in the website.

### Website Update Rules
- Create clear navigation among Home, Domain Knowledge / System Design, Development Process, and Play Game.
- Use only information supported by this brief, the system graph, the actual game, and the development log. Do not invent a smoother or more complete process.
- After every meaningful milestone, update the relevant website content and the development timeline.
- Keep the game idea and domain-learning explanation readable by classmates who have not seen the project before.
- Keep styling coherent across the informational pages and playable game, but prioritize clarity and function over decorative effects.
- Make the website usable on a typical student laptop. Mobile support is helpful but is not the first-version priority.
- Use relative links and asset paths. GitHub Pages serves the site from `https://<username>.github.io/<repository-name>/`, so root-absolute paths beginning with `/` will fail.
- Support a clean 1920×1080 exhibition view for display on an iMac. Important controls and text must fit without overlap.

## 13. Automatic Human-AI Development Log Protocol
In addition to building the website and game, maintain one Markdown file named `agent-development-log.md`. This file documents how the project develops through human-AI collaboration.

### Initialize the Log
At the beginning of development, create the file with:

```markdown
# Agent Development Log

- Project Title: Last Dash
- Student / Team: Yizhou Zhang
- Domain: 3D drone control and spatial navigation in a dynamic threat environment.
- Core Learning Shift: Beginners think success means flying directly and quickly toward the target; experts know it means managing speed, space, and changing threats so they always preserve enough room to maneuver and correct their approach.
- Current Game Idea: I became interested after seeing footage from the Russia–Ukraine war showing FPV drones navigating through heavy defensive threats. The combination of risk, movement, and fast decision-making also fits video game design well.
- AI Agent Used: CodeX or Zcode
- System Graph: add the image file or Canva link when available
- Development Period: add start and end dates
```

### Two Entry Types in One Timeline
Keep Raw Interaction Logs and Stage Reflections in chronological order in the same file. Do not separate them into two large sections.

#### A. Raw Interaction Log — Create Automatically
After every meaningful development interaction, append a short factual entry. A meaningful interaction includes implementation, debugging, code explanation that changes the project, mechanic or level changes, visual or audio changes, website updates, playtesting, or an AI suggestion that affects direction. Do not log casual clarification that produces no development change.

Use this format:

```markdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## Interaction 01 — Raw Interaction Log

**Time:**
**Development Stage:**
**Current Goal:**

### Student Request
What the student asked the AI Agent to do.

### Agent Response Summary
What the Agent suggested, generated, explained, or changed.

### Development Action
What was actually implemented, modified, tested, or removed.

### Website Update
Which website section changed, or why no website update was needed.

### Files / Systems Changed
List files, mechanics, assets, data, UI, or challenge settings changed.

### Test and Immediate Result
What was tested and whether it worked, failed, partially worked, or remains uncertain.

### Student Decision / Follow-up
What the student accepted, rejected, modified, did not understand, or decided to try next.
```

#### B. Stage Reflection — Prompt the Student at Milestones
Do not fabricate student reflection. At a meaningful milestone—such as finishing the first playable loop, changing design direction, completing a challenge, or finishing a playtest stage—create a Reflection entry with factual fields, then explicitly ask the student to answer the Required Student Reflection.

Use this format:

```markdown
════════════════════════════════════
## Reflection 01 — Stage Reflection

**Time:**
**Covered Interactions:** Interaction 01–04
**Development Stage:**

### Goal of This Stage
### What Changed in the Playable Game and Website
### How AI Helped
### Student Decisions
### AI Influence on Design Direction
### Relationship to the Core Learning Shift
### Problems / Open Questions
### Next Step

### Required Student Reflection
Does the current game still help the player experience the intended domain-learning shift? What became stronger, weaker, or different? Which AI suggestion did you accept, reject, or change, and why?

> The AI Agent must ask the student to answer this section and must not answer it for them.
```

### Logging Rules
- Append new entries to the end of `agent-development-log.md` and continue Interaction and Reflection numbering.
- Be honest and specific. Record failures, partial results, misunderstandings, abandoned directions, and unresolved questions.
- Record when AI introduces a design direction, when the student rejects or modifies it, and when the student accepts code without fully understanding it.
- Separate factual development events from student reflection. Never invent student opinions or decisions.
- After milestone reflections, update the Development Process section of the website with a concise, truthful timeline summary.

## 14. GitHub Pages Exhibition

The exhibition is the published Pages site. No archive is packaged and nothing is uploaded to a shared drive.

### Enable GitHub Pages
1. Open the repository on GitHub.
2. `Settings` -> `Pages`.
3. Under Build and deployment, set Source to `Deploy from a branch`.
4. Branch: `main`, Folder: `/ (root)`. Save.
5. Wait a few minutes, then open `https://<username>.github.io/<repository-name>/`.

Every later push to `main` republishes the site automatically.

### Pre-Publish Audit
- Run the project through a local static HTTP server and test every navigation link, the playable game, controls, challenge selection, success, failure, and restart.
- Confirm every internal link and asset path is relative. Root-absolute paths are the most common cause of a Pages site that loads but shows nothing.
- Test the layout at 1920x1080 for exhibition display; text, controls, canvas, and navigation must not overlap.
- Confirm `node_modules`, caches, temporary files, passwords, tokens, and API keys are not committed.
- Push, then open the live Pages URL and repeat the navigation and gameplay test.

### What the Student Submits
- The GitHub Pages URL: the playable exhibition link.
- The repository URL.
- Nothing else. The repository is already public, so there is no upload step.

### Public Display
- The repository and the published site are public, because GitHub Pages requires a public repository on the free plan.
- Anything the student does not want published simply stays out of the repository.
- The student must confirm before publishing that `brief.md`, `ratings.csv`, and `development-log/agent-development-log.md` may be publicly visible.

## 15. Instructions for the AI Agent

1. **Index the workspace before planning anything.** List every file in the project folder, then read `brief.md` and `system-graph.png`. Report what you found: which files exist, what the brief specifies, and what is missing or contradictory. Do not write code before this step.
2. Restate the core learning shift, core loop, main variables, feedback mappings, and challenge presets in a short implementation plan.
3. Identify missing or contradictory information. Ask only questions that block the first playable version.
4. Propose the repository structure, then create the website skeleton (`index.html`, `game.html`, `process.html`, `assets/`) and initialize `development-log/agent-development-log.md`.
5. Implement the smallest complete game loop first, then add the defined challenge presets.
6. Keep variable names clear, and keep environment data, player-controlled data, and calculated results visibly separated in the code.
7. Add short comments only where a high-school student needs help understanding a rule.
8. **The first milestone must ship the playable demo and the first version of `index.html` together.** Never let the website fall behind the game, and never leave the site to the end of the project.
9. Start a local static server, test navigation and gameplay, and give the student the local URL and simple controls.
10. Automatically append a Raw Interaction Log after meaningful development work, and request student reflection at milestones.
11. After every milestone, update the website so its Development Process page matches the actual log.
12. Before the exhibition, run the pre-publish audit and confirm the live GitHub Pages URL works.

## 16. Acceptance Checklist
- [ ] The player can take a meaningful action within 30 seconds.
- [ ] Player actions visibly change system data or state.
- [ ] Important invisible data is translated into readable feedback.
- [ ] Success and failure conditions work and can be understood.
- [ ] A second attempt can improve because the player learned from feedback.
- [ ] Challenge presets differ through variables, relationships, information, or constraints.
- [ ] The game runs in a browser without a complex installation process.
- [ ] README.md identifies the dependency track and explains how to run, the controls, and the main variables.
- [ ] `index.html` existed from the first milestone and was kept current, not added at the end.
- [ ] The site clearly presents the game idea, domain knowledge, system design, development process, and playable game.
- [ ] `development-log/agent-development-log.md` contains chronological Interaction and Reflection entries.
- [ ] The Development Process page matches the actual log and does not hide failures or unfinished work.
- [ ] All internal links and assets use relative paths, because Pages serves from a subpath.
- [ ] The published GitHub Pages URL has been opened and tested at 1920x1080.
- [ ] No passwords, API keys, tokens, or `node_modules` are committed.
- [ ] The student has confirmed the brief, ratings, and development log may be publicly visible.
