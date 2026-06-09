# Vocab image checklist

Tracks an asset for every word in `src/data/vocab/words.ts` (608 words). Three routes —
tick a box when a word is handled. Counts as of the last review: **105 picked, 97 downloaded.**

- **Route A — Photo gallery:** `node tools/scripts/images/review-server.mjs` → http://localhost:4399
- **Route B — Illustration:** grab from [Irasutoya](https://www.irasutoya.com/), then
  `node tools/scripts/images/add-local-image.mjs "<word>" <file> [--page <url>]`
- **Route C — Skip image:** render as SVG / colour swatch / number-text in the UI; no file.

See [tools/README.md](../README.md) for full pipeline docs. Borderline words note an alt route in
parentheses — move them if the first route looks bad.

---

## ✓ Done — fully picked (photo)
Drinks · Dessert · Food · Japanese Food · Fruit and Vegetables · Meals · Ingredients ·
Taste · Feelings — all complete. (Run `download-images.mjs` to pull the ~8 picked-but-not-yet-downloaded.)

---

## Route A — Photo gallery (concrete nouns)

### People (photographable subset)
- [ ] man
- [ ] woman
- [ ] boy
- [ ] girl
- [ ] baby
- [ ] children
- [ ] classmates
- [ ] friends

### Body Parts
- [ ] hair
- [ ] head
- [ ] face
- [ ] eye
- [ ] ear
- [ ] nose
- [ ] mouth
- [ ] shoulder
- [ ] teeth
- [ ] hand
- [ ] arm
- [ ] neck
- [ ] knee
- [ ] leg
- [ ] toe

### Clothes
- [ ] shirt
- [ ] T-shirt
- [ ] sweatshirt
- [ ] sweater
- [ ] uniform
- [ ] pants
- [ ] jeans
- [ ] cap
- [ ] hat
- [ ] gloves
- [ ] socks
- [ ] shoes

### Personal Belongings
- [ ] bag
- [ ] bat
- [ ] glove
- [ ] racket
- [ ] soccer shoes
- [ ] umbrella
- [ ] glass
- [ ] mug
- [ ] textbook
- [ ] comic book
- [ ] dictionary
- [ ] present
- [ ] treasure
- [ ] sticker
- [ ] ticket
- [ ] watch
- [ ] TV
- [ ] computer
- [ ] smartphone
- [ ] tablet
- [ ] desk
- [ ] chair
- [ ] bed

### Stationery
- [ ] crayon
- [ ] marker
- [ ] pen
- [ ] pencil
- [ ] pencil case
- [ ] eraser
- [ ] ruler
- [ ] glue
- [ ] scissors
- [ ] stapler
- [ ] notebook
- [ ] pencil sharpener

### Animals
- [ ] bear
- [ ] elephant
- [ ] tiger
- [ ] lion
- [ ] horse
- [ ] zebra
- [ ] camel
- [ ] giraffe
- [ ] gorilla
- [ ] monkey
- [ ] orangutan
- [ ] panda
- [ ] koala
- [ ] dog
- [ ] cat
- [ ] fox
- [ ] rabbit
- [ ] mouse
- [ ] crocodile
- [ ] snake
- [ ] frog
- [ ] bird

### Sea Animals
- [ ] whale
- [ ] dolphin
- [ ] penguin
- [ ] sea turtle
- [x] fish
- [ ] shark
- [ ] crab
- [ ] jellyfish

### Bugs
- [ ] ant
- [ ] beetle
- [ ] stag beetle
- [ ] butterfly
- [ ] dragonfly
- [ ] grasshopper
- [ ] mantis
- [ ] spider

### Nature
- [ ] desert
- [ ] forest
- [ ] rainforest
- [ ] lake
- [ ] mountain
- [ ] river
- [ ] savanna
- [ ] sea

### Seasons
- [ ] spring
- [ ] summer
- [ ] fall
- [ ] winter

### Weather
- [ ] sunny
- [ ] cloudy
- [ ] windy
- [ ] rainy
- [ ] snowy
- [x] cold
- [ ] warm
- [x] hot
- [ ] humid

### Times of day (from Daily Routines)
- [ ] morning
- [ ] afternoon
- [ ] evening
- [ ] night

### School Subjects (concrete)
- [ ] English
- [ ] Japanese
- [ ] math
- [ ] science
- [ ] music
- [ ] arts and crafts
- [ ] P.E.

### School Places
- [ ] classroom
- [ ] computer room
- [ ] entrance
- [ ] gym
- [ ] library
- [ ] music room
- [ ] playground
- [ ] school nurse's office
- [ ] restroom
- [ ] swimming pool
- [ ] teachers' office
- [ ] school principal's office

### Club Activities
- [ ] baseball team
- [ ] softball team
- [ ] basketball team
- [ ] volleyball team
- [ ] soccer team
- [ ] tennis team
- [ ] table tennis team
- [ ] badminton team
- [ ] dance team
- [ ] track and field team
- [ ] art club
- [ ] cooking club
- [ ] drama club
- [ ] brass band
- [ ] chorus
- [ ] broadcasting club
- [ ] newspaper club
- [ ] photography club

### School Events (photographable)
- [ ] field trip
- [ ] school trip
- [ ] music festival
- [ ] school festival
- [ ] sports day
- [ ] swimming meet
- [ ] summer vacation
- [ ] entrance ceremony
- [ ] graduation ceremony

### Musical Instruments
- [ ] recorder
- [ ] harmonica
- [ ] triangle
- [ ] piano
- [ ] guitar
- [ ] violin
- [ ] drum
- [ ] xylophone
- [ ] keyboard harmonica

### Play and Activities
- [ ] camping
- [ ] dancing
- [ ] fishing
- [ ] hiking
- [ ] shopping
- [ ] reading
- [ ] drawing
- [ ] jogging
- [ ] skateboarding
- [ ] swinging
- [ ] playing the piano
- [ ] playing video games
- [ ] seeing movies
- [ ] cards
- [ ] jump rope
- [ ] tag
- [ ] hide-and-seek
- [ ] rock-paper-scissors

### Sports
- [ ] baseball
- [ ] basketball
- [ ] volleyball
- [ ] dodgeball
- [ ] rugby
- [ ] soccer
- [ ] tennis
- [ ] table tennis
- [ ] badminton
- [ ] cricket
- [ ] gymnastics
- [ ] track and field
- [ ] judo
- [ ] kendo
- [ ] sumo
- [ ] swimming
- [ ] skateboarding
- [ ] skiing

### Town and Places
- [ ] house
- [ ] park
- [ ] library
- [ ] museum
- [ ] hospital
- [ ] bus stop
- [ ] station
- [ ] police station
- [ ] fire station
- [ ] post office
- [ ] bookstore
- [ ] restaurant
- [ ] supermarket
- [ ] castle
- [ ] shrine
- [ ] temple
- [ ] church
- [ ] aquarium
- [ ] stadium
- [ ] zoo
- [ ] amusement park
- [ ] convenience store
- [ ] elementary school
- [ ] junior high school

### Vehicles
- [ ] bus
- [ ] taxi
- [ ] bike
- [x] train *(illustration, not photo)*

### Jobs
- [ ] artist
- [ ] writer
- [ ] singer
- [ ] comedian
- [ ] doctor
- [ ] nurse
- [ ] vet
- [ ] zookeeper
- [ ] cook
- [ ] baker
- [ ] farmer
- [ ] police officer
- [ ] fire fighter
- [ ] pilot
- [ ] programmer
- [ ] office worker
- [ ] astronaut
- [ ] teacher
- [ ] researcher
- [ ] scientist
- [ ] flight attendant
- [ ] baseball player
- [ ] mountaineer

### Annual Events (photographable)
- [ ] birthday
- [ ] Halloween
- [ ] Christmas

---

## Route B — Illustration (Irasutoya · `add-local-image.mjs`)

### Pronouns (from People)
- [ ] I
- [ ] you
- [ ] she
- [ ] he
- [ ] we

### Personality
- [x] active
- [x] brave
- [x] friendly
- [x] funny
- [x] kind
- [x] shy
- [x] smart
- [x] strong

### Family (relational — a photo of a person won't read as "uncle")
- [x] grandfather
- [x] grandmother
- [x] grandparents
- [x] father
- [x] mother
- [x] uncle
- [x] aunt
- [x] parents
- [x] brother
- [x] sister
- [x] cousin
- [x] me *(family-tree diagram, ME circled — reroll later if you want a cleaner single figure)*

### Frequency
- [ ] always
- [ ] usually
- [ ] sometimes
- [ ] never

### Positions (prepositions — need a diagram)
- [ ] by
- [ ] in
- [ ] on
- [ ] under

### Directions
- [ ] go
- [ ] straight
- [ ] turn
- [ ] right
- [ ] left
- [ ] see
- [ ] up
- [ ] down
- [ ] block
- [ ] corner

### Daily Routines (action phrases)
- [x] get up
- [x] comb my hair
- [x] take out the garbage
- [x] get the newspaper
- [x] have breakfast
- [x] brush my teeth
- [x] go to school
- [x] study English
- [x] have lunch
- [x] go home
- [x] play soccer
- [x] walk my dog
- [x] do my homework
- [x] have dinner
- [x] wash the dishes
- [x] watch TV
- [x] take a bath
- [x] go to bed

### Verbs — 5th Grade (single-action illustrations read clearer than photos)
- [ ] spell
- [ ] like
- [ ] listen
- [ ] want
- [ ] play
- [x] walk
- [x] run
- [x] dance
- [x] jump
- [ ] catch
- [x] swim
- [ ] fly
- [x] sing
- [x] cook
- [ ] have
- [ ] go
- [ ] turn
- [ ] see
- [ ] look
- [x] drink
- [x] eat
- [ ] buy

### Verbs — 6th Grade
- [ ] speak
- [ ] live
- [ ] make
- [ ] wear
- [ ] talk
- [ ] watch
- [x] read
- [ ] help
- [ ] practice
- [ ] clean
- [ ] enjoy
- [ ] visit
- [ ] ride
- [ ] come
- [ ] get
- [ ] save
- [ ] stop
- [ ] study
- [ ] join
- [ ] work

### Past Tense Verbs
- [ ] ate
- [ ] went
- [ ] saw
- [ ] had
- [ ] made
- [ ] enjoyed
- [ ] played
- [ ] watched

### Impressions (abstract adjectives)
- [x] good
- [x] great
- [x] bad
- [x] nice
- [x] amazing
- [x] fantastic
- [x] wonderful
- [x] beautiful
- [x] cool
- [x] cute
- [x] favorite
- [x] interesting
- [x] exciting
- [x] famous
- [x] popular
- [x] colorful
- [x] international
- [x] fun

### Conditions (comparative pairs)
- [ ] big
- [ ] small
- [ ] long
- [ ] short
- [ ] new
- [ ] old
- [ ] fast
- [ ] slow
- [ ] high
- [ ] low

### Environment and 4Rs (concepts)
- [ ] forest loss
- [ ] plant trees
- [ ] global warming
- [ ] save energy
- [ ] plastic
- [ ] use eco-friendly bags
- [ ] refuse
- [ ] reduce
- [ ] reuse
- [ ] recycle

### School Subjects (abstract)
- [ ] calligraphy
- [ ] social studies
- [ ] home economics
- [ ] moral education
- [ ] period for integrated studies

### School Events (abstract / ceremony)
- [ ] chorus contest
- [ ] volunteer day
- [ ] drama festival
- [ ] evacuation drill

### Annual Events (culture-specific — Irasutoya excels here)
- [x] New Year's Day
- [x] Dolls' Festival
- [x] cherry blossom viewing
- [x] Children's Day
- [x] Star Festival
- [x] fireworks festival
- [x] New Year's Eve

---

## Route C — Skip image (render in UI, no file)

### Colors → solid colour swatch tile
- [ ] white
- [ ] red
- [x] orange
- [ ] yellow
- [ ] green
- [ ] pink
- [ ] purple
- [ ] brown
- [ ] black
- [ ] blue
- [ ] light blue
- [ ] yellow green
- [ ] gold
- [ ] silver

### Shapes → simple SVG
- [ ] circle
- [ ] cross
- [ ] diamond
- [ ] heart
- [ ] rectangle
- [ ] square
- [ ] star
- [ ] triangle

### Numbers / text — render as number or Japanese text, not an image
- Dates: 1st–31st (31)
- Months: January–December + one year (13)
- Days: Sunday–Saturday + one week (8)
