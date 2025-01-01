const prisma = require('./config/db');

//places
const trivandrumPlaces = {
  Kazhakkootam: ["Technopark", "Kulathoor", "Karyavattom", "Pothencode", "Sreekaryam"],
  Attingal: ["Manampur", "Moonnamoodu", "Kizhakkupuram", "Cherunniyoor", "Thonnakkal"],
  Varkala: ["Vettoor", "Edava", "Palachira", "Kappil", "Cherunniyoor"],
  Chirayinkeezhu: ["Perumathura", "Anathalavattom", "Puthukurichi", "Ottoor", "Mudakkal"],
  Thampanoor: ["Overbridge", "Pazhavangadi", "Killipalam", "Manacaud", "Palayam"],
  EastFort: ["Chalai", "Puthenchantha", "Attakulangara", "Fort Gate", "Karamana"],
  Pettah: ["Muttathara", "Chackai", "Anayara", "Vallakadavu", "Kannammoola"],
  Neyyattinkara: ["Balaramapuram", "Parassala", "Karode", "Kattakada", "Poovar"],
  Kovalam: ["Vizhinjam", "Eve's Beach", "Hawah Beach", "Lighthouse Beach", "Mukkola"],
  Vizhinjam: ["Kottapuram", "Mulloor", "Adimalathura", "Pachalloor", "Thiruvallam"]
};

async function populatePlacesAndSubplaces() {
  try {
    for (const [place, subplaces] of Object.entries(trivandrumPlaces)) {
      // Create the Place
      const createdPlace = await prisma.place.create({
        data: { name: place }
      });

      // Create associated Subplaces
      const subplaceData = subplaces.map(subplace => ({
        name: subplace,
        placeId: createdPlace.id
      }));

      await prisma.subplace.createMany({
        data: subplaceData
      });

      console.log(`Added ${place} with subplaces.`);
    }
    console.log('All places and subplaces added successfully!');
  } catch (error) {
    console.error('Error populating data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

populatePlacesAndSubplaces();
