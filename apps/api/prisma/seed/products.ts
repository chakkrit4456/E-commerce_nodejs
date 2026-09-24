/**
 * สินค้าตัวอย่าง: ภาพจริงจาก Wikimedia Commons / Openverse (ดู images-manifest.json + images/credits.json)
 * คำอธิบายเขียนจากสิ่งที่เห็นในภาพเท่านั้น; ยี่ห้อระบุเฉพาะที่ปรากฏบนสินค้า/ระบุในข้อมูลของภาพ
 * ราคา/สต็อกเป็นตัวเลขสมมติสำหรับ demo (ภาพไม่ได้ระบุราคา)
 */
export interface SeedProduct {
  slug: string; // ตรงกับชื่อไฟล์รูปใน images/ (`<slug>-1.jpg`, `<slug>-2.jpg`, …)
  name: string;
  category: string;
  brand?: string;
  price: number;
  discountPercent?: number;
  stock: number;
  todaysDeal?: boolean;
  featured?: boolean;
  description: string;
  tags: string;
}

export const SEED_PRODUCTS: SeedProduct[] = [
  {
    slug: 'cube-mountain-bike', name: 'Cube Full-Suspension Mountain Bike', category: 'Sports & outdoor', brand: 'Cube',
    price: 2490, stock: 4, todaysDeal: true, featured: true, tags: 'mountain bike,bicycle,cube,full suspension',
    description: 'Full-suspension mountain bike with a dark grey frame, gold-coloured suspension fork, knobby tan-wall tyres and disc brakes. Photographed on display at Cyclingworld Europe 2024.',
  },
  {
    slug: 'dell-inspiron-1525-laptop', name: 'Dell Inspiron 1525 Laptop (Pre-owned)', category: 'Computer & Accessories', brand: 'Dell',
    price: 199, discountPercent: 10, stock: 3, todaysDeal: true, tags: 'laptop,notebook,dell,inspiron',
    description: 'Dell Inspiron 1525 notebook with a silver-grey keyboard deck, full-size keyboard, touchpad and black screen bezel. An older-generation model sold pre-owned; condition as shown in the photo.',
  },
  {
    slug: 'apple-airpods-pro-2nd-generation', name: 'Apple AirPods Pro (2nd generation)', category: 'Cellphones & Tabs', brand: 'Apple',
    price: 249, stock: 12, todaysDeal: true, featured: true, tags: 'earbuds,airpods,wireless,apple,earphones',
    description: 'Wireless in-ear earbuds with silicone ear tips and a compact white charging case. The photo shows both earbuds out of the case.',
  },
  {
    slug: 'blackview-a60-smartphone', name: 'Blackview A60 Android Smartphone', category: 'Cellphones & Tabs', brand: 'Blackview',
    price: 79, discountPercent: 5, stock: 15, todaysDeal: true, tags: 'smartphone,android,phone,blackview',
    description: 'Android smartphone with a waterdrop-notch display and a dark body. Photos show the home screen, the lock screen and the plain black front.',
  },
  {
    slug: 'apple-airpods-charging-case', name: 'Apple AirPods with Charging Case', category: 'Cellphones & Tabs', brand: 'Apple',
    price: 129, stock: 18, tags: 'earbuds,airpods,wireless,apple,earphones',
    description: 'White wireless earbuds with a white charging case, shown with the case lid open and both earbuds out.',
  },
  {
    slug: 'junghans-mega-wristwatch', name: 'Junghans Mega Analog Wristwatch', category: 'Jewelry & Watches', brand: 'Junghans',
    price: 149, stock: 5, featured: true, tags: 'watch,wristwatch,analog,junghans,leather strap',
    description: 'Round analog wristwatch with a white dial, thin black hands, a small digital display window near the top of the dial, a gold-tone bezel and a red leather strap.',
  },
  {
    slug: 'citizen-quartz-two-tone-wristwatch', name: 'Citizen Quartz Two-Tone Wristwatch', category: 'Jewelry & Watches', brand: 'Citizen',
    price: 89, stock: 6, tags: 'watch,wristwatch,quartz,citizen,two-tone',
    description: 'Quartz wristwatch with a round silver-tone dial, a date window and a two-tone (silver and gold-colour) metal bracelet.',
  },
  {
    slug: 'silver-hamsa-pendant-necklace', name: 'Silver Hamsa Pendant Necklace', category: 'Jewelry & Watches',
    price: 59, discountPercent: 15, stock: 8, tags: 'necklace,silver,pendant,hamsa,jewelry',
    description: 'Silver-coloured twisted-rope chain with an openwork hamsa-hand pendant set with blue inlay.',
  },
  {
    slug: 'panasonic-cordless-drill-driver', name: 'Panasonic Cordless Drill Driver', category: 'Home Improvement & Tools', brand: 'Panasonic',
    price: 119, stock: 9, tags: 'drill,cordless,power tool,panasonic,driver',
    description: 'Cordless drill/driver with a black-and-grey body, chuck and a slide-on rechargeable battery pack at the base. Panasonic branding is visible on the tool.',
  },
  {
    slug: 'red-cordless-drill-with-charger', name: 'Red Cordless Drill with 12V Battery and Charger', category: 'Home Improvement & Tools',
    price: 45, stock: 10, tags: 'drill,cordless,power tool,12v,charger',
    description: 'Red-and-black cordless drill with a 12V battery pack, a plug-in charger and a couple of driver bits shown alongside it.',
  },
  {
    slug: 'cordless-led-desk-lamp', name: 'Cordless LED Table Lamp', category: 'Home decoration & Appliance',
    price: 39, stock: 14, tags: 'lamp,led,desk lamp,cordless,battery',
    description: 'Battery-powered cordless table lamp in white with a cylindrical shade on a round base. A promotional logo is printed on top of the shade.',
  },
  {
    slug: 'teal-yoga-mat', name: 'Teal Yoga Mat', category: 'Sports & outdoor',
    price: 18, stock: 30, tags: 'yoga,mat,exercise,fitness',
    description: 'Teal yoga mat with a matte, finely textured surface. Photos show it rolled up, standing on end and partly unrolled.',
  },
  {
    slug: 'navy-floral-summer-dress', name: 'Navy Floral Summer Dress', category: 'Women Clothing & Fashion',
    price: 42, stock: 12, featured: true, tags: 'dress,summer,floral,women',
    description: 'Short-sleeved navy dress with a small light-blue floral print. The photo shows the dress from the sleeves down to the skirt.',
  },
  {
    slug: 'baby-clothes-set', name: 'Baby Clothes Set (5 Outfits)', category: 'Kids & toy',
    price: 34, stock: 20, tags: 'baby,clothes,infant,set',
    description: 'Set of five baby outfits in white, green, purple and pink, shown on hangers. A pair of tiny socks lies beside them.',
  },
  {
    slug: 'vintage-gottschalk-dollhouse', name: 'Vintage Gottschalk Dollhouse with Miniature Rooms', category: 'Kids & toy',
    price: 750, stock: 2, tags: 'dollhouse,doll house,toy,vintage,miniature',
    description: 'Multi-storey collectible dollhouse with a brick-pattern facade and blue roof, flanked on both sides by room boxes filled with miniature furniture. Photographed as a display piece.',
  },
  {
    slug: 'day-cream-jar', name: 'Day Cream in Glass Jar', category: 'Beauty, Health & Hair',
    price: 16, stock: 25, tags: 'cream,day cream,skincare,face cream',
    description: 'White day cream in a small glass jar with a blue screw cap. The foil inner seal is peeled partly back to show the cream.',
  },
];
