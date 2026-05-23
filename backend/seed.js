import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Product from './models/Product.js';
import Order from './models/Order.js';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const allProducts = [
    {
        id: 'ceylon-set',
        name: 'The Silonka Set',
        description: 'Four essential spices in elegant gift packaging',
        longDescription: 'A curated gift set featuring four of Sri Lanka\'s finest spices — True Ceylon Cinnamon, Tellicherry Black Pepper, Hand-Picked Cloves, and Green Cardamom Pods. Each spice is hand-selected from our partner farms in the hill country, sun-dried using traditional methods, and sealed at peak potency.\n\nPerfect as a gift for the home chef or a treat for yourself. Presented in a custom linen-wrapped box with tasting notes and recipe cards.',
        price: 89,
        image: '/collection_set.jpg',
        category: 'sets',
        weight: '4 x 75g',
        origin: 'Sri Lanka — Kandy & Matale Regions',
        ingredients: 'Ceylon Cinnamon Sticks, Tellicherry Black Peppercorns, Whole Cloves, Green Cardamom Pods',
        shelfLife: '24 months from packaging',
        certifications: ['Organic', 'Fair Trade', 'Non-GMO'],
        variations: [
            { label: 'Standard Set (4 x 75g)', price: 89, inStock: true },
            { label: 'Grand Set (4 x 150g)', price: 149, inStock: true },
        ],
        reviews: [
            { userName: 'Sarah M.', rating: 5, comment: 'Absolutely stunning gift packaging and the spices are incredibly fresh. Best cinnamon I\'ve ever tasted!' },
            { userName: 'David K.', rating: 4, comment: 'Beautiful presentation. The aroma when you open the box is incredible. Would love a larger size option.' },
            { userName: 'Amara J.', rating: 5, comment: 'Bought this for my mother-in-law and she was thrilled. The quality is evident in every spice.' },
        ],
    },
    {
        id: 'black-pepper',
        name: 'Tellicherry Black Pepper',
        description: 'Extra-bold peppercorns with citrus and floral notes',
        longDescription: 'Our Tellicherry Black Pepper is sourced from the misty highlands of Sri Lanka, where volcanic soil and tropical rains produce peppercorns of extraordinary complexity. These extra-bold berries are left on the vine longer than standard pepper, developing deeper flavour compounds.\n\nExpect bright citrus top notes, a warm floral middle, and a lingering, satisfying heat. Perfect cracked over steaks, grilled fish, or fresh salads. Store in a cool, dark place in an airtight container.',
        price: 24,
        image: '/pepper_palette.jpg',
        category: 'pepper',
        weight: '100g',
        intensity: 80,
        origin: 'Sri Lanka — Matale District',
        ingredients: '100% Whole Tellicherry Black Peppercorns',
        shelfLife: '18 months from packaging',
        certifications: ['Organic', 'Single-Origin'],
        variations: [
            { label: '50g', price: 14, inStock: true },
            { label: '100g', price: 24, inStock: true },
            { label: '250g', price: 52, inStock: true },
        ],
        reviews: [
            { userName: 'Chef Ravi', rating: 5, comment: 'The complexity of flavour is unmatched. Citrus and floral notes are clearly present. Top shelf pepper.' },
            { userName: 'Elena F.', rating: 5, comment: 'Night and day difference from supermarket pepper. I use it on everything now.' },
        ],
    },
    {
        id: 'white-pepper',
        name: 'Muntok White Pepper',
        description: 'Milder, earthier flavor perfect for light sauces',
        longDescription: 'Muntok White Pepper offers a refined, earthy heat without the sharp bite of black pepper. The outer husk is carefully removed by soaking in spring water, revealing a smooth, pale kernel with subtle musky and fermented notes.\n\nIdeal for béchamel sauces, cream soups, delicate fish dishes, and anywhere you want pepper flavour without dark specks. A staple of French and Southeast Asian cuisines.',
        price: 22,
        image: '/pepper_palette.jpg',
        category: 'pepper',
        weight: '100g',
        intensity: 50,
        origin: 'Sri Lanka — Southern Province',
        ingredients: '100% Whole White Peppercorns',
        shelfLife: '18 months from packaging',
        certifications: ['Non-GMO'],
        variations: [
            { label: '50g', price: 13, inStock: true },
            { label: '100g', price: 22, inStock: true },
            { label: '250g', price: 48, inStock: true },
        ],
        reviews: [
            { userName: 'Michel L.', rating: 4, comment: 'Excellent white pepper with genuine earthy complexity. Great for my béchamel.' },
        ],
    },
    {
        id: 'ceylon-cinnamon',
        name: 'True Ceylon Cinnamon',
        description: 'Delicate, sweet, naturally low in coumarin',
        longDescription: 'True Ceylon Cinnamon (Cinnamomum verum) is the world\'s most prized cinnamon, grown exclusively in Sri Lanka. Unlike common cassia, Ceylon cinnamon has a delicate, nuanced sweetness with notes of honey and citrus, and contains naturally low levels of coumarin.\n\nOur quills are hand-peeled by master cinnamon peelers whose families have practiced this art for generations. The paper-thin bark layers create a distinctive multi-layered quill with an intoxicating aroma.\n\nPerfect in chai, baked goods, curries, and as a stirring stick in warm beverages.',
        price: 14,
        image: '/cinnamon_signature.jpg',
        category: 'cinnamon',
        weight: '50g',
        origin: 'Sri Lanka — Galle & Matara Districts',
        ingredients: '100% True Ceylon Cinnamon Quills (Cinnamomum verum)',
        shelfLife: '24 months from packaging',
        certifications: ['Organic', 'Single-Origin', 'Low Coumarin'],
        variations: [
            { label: '25g', price: 8, inStock: true },
            { label: '50g', price: 14, inStock: true },
            { label: '100g', price: 24, inStock: true },
        ],
        reviews: [
            { userName: 'Priya S.', rating: 5, comment: 'The real deal. Once you try true Ceylon cinnamon, you can never go back to cassia. The aroma is heavenly.' },
            { userName: 'James W.', rating: 5, comment: 'I use this in my morning coffee. The flavour is so much more complex and gentle than supermarket cinnamon.' },
            { userName: 'Nadia R.', rating: 4, comment: 'Beautiful quills, great aroma. Would appreciate a resealable pouch in future.' },
        ],
    },
    {
        id: 'cinnamon-powder',
        name: 'Ceylon Cinnamon Powder',
        description: 'Fine-ground for baking and beverages',
        longDescription: 'Our Ceylon Cinnamon Powder is stone-ground from the same premium quills we sell whole, preserving the essential oils and delicate flavour compounds. The result is a fine, fragrant powder with a warm amber colour.\n\nPerfect for baking, smoothies, oatmeal, and any recipe calling for ground cinnamon. Because it\'s true Ceylon, it blends smoothly without the harsh, sharp taste of cassia.',
        price: 16,
        image: '/ground_powder.jpg',
        category: 'cinnamon',
        weight: '75g',
        origin: 'Sri Lanka — Galle District',
        ingredients: '100% Ground Ceylon Cinnamon (Cinnamomum verum)',
        shelfLife: '12 months from packaging',
        certifications: ['Organic', 'Gluten-Free'],
        variations: [
            { label: '75g', price: 16, inStock: true },
            { label: '150g', price: 28, inStock: true },
        ],
        reviews: [
            { userName: 'Cooking with Ana', rating: 5, comment: 'So fragrant! My cinnamon rolls have never tasted better. This is now a staple in my kitchen.' },
        ],
    },
    {
        id: 'whole-cloves',
        name: 'Hand-Picked Cloves',
        description: 'Intense aroma, perfect for mulled wine and curries',
        longDescription: 'Our whole cloves are hand-picked at the perfect stage of maturity, when their essential oil content is at its peak. Each bud is sun-dried to lock in the intense, warm aroma with notes of eugenol.\n\nUse whole in rice pilafs, mulled wine, stews, and marinades. Crush lightly before adding to spice blends. A little goes a long way — these are among the most potent cloves available.',
        price: 18,
        image: '/whole_spices.jpg',
        category: 'spices',
        weight: '50g',
        origin: 'Sri Lanka — Central Province',
        ingredients: '100% Whole Dried Clove Buds (Syzygium aromaticum)',
        shelfLife: '24 months from packaging',
        certifications: ['Organic'],
        variations: [
            { label: '25g', price: 10, inStock: true },
            { label: '50g', price: 18, inStock: true },
        ],
        reviews: [
            { userName: 'Marco B.', rating: 5, comment: 'The aroma is incredible. I made mulled wine with these and it was the best batch ever.' },
        ],
    },
    {
        id: 'cardamom',
        name: 'Green Cardamom Pods',
        description: 'Fragrant pods for chai and desserts',
        longDescription: 'Green Cardamom, known as the "Queen of Spices," is one of the world\'s most valuable spice crops. Our pods are harvested just before full ripeness, preserving the bright green colour and complex flavour profile.\n\nCrack open a pod and you\'ll find intensely aromatic black seeds with notes of eucalyptus, mint, and lemon. Essential for authentic chai, Scandinavian baking, Middle Eastern coffee, and Indian desserts.',
        price: 28,
        image: '/whole_spices.jpg',
        category: 'spices',
        weight: '40g',
        origin: 'Sri Lanka — Knuckles Range',
        ingredients: '100% Whole Green Cardamom Pods (Elettaria cardamomum)',
        shelfLife: '18 months from packaging',
        certifications: ['Organic', 'Fair Trade'],
        variations: [
            { label: '20g', price: 16, inStock: true },
            { label: '40g', price: 28, inStock: true },
            { label: '100g', price: 62, inStock: true },
        ],
        reviews: [
            { userName: 'Leila A.', rating: 5, comment: 'Makes the most amazing chai. The pods are plump and deeply fragrant.' },
            { userName: 'Thomas G.', rating: 4, comment: 'Top quality cardamom. I use it in my sourdough cardamom buns — incredible flavour.' },
        ],
    },
    {
        id: 'nutmeg',
        name: 'Whole Nutmeg',
        description: 'Fresh-grated warmth for béchamel and baking',
        longDescription: 'Whole nutmeg offers a warm, slightly sweet flavour with hints of clove and pepper. Unlike pre-ground nutmeg, our whole kernels retain their essential oils until the moment you grate them, delivering maximum aroma and taste.\n\nFreshly grated nutmeg elevates béchamel sauce, eggnog, pumpkin pie, creamed spinach, and countless other dishes. Keep a whole nutmeg and a microplane in your kitchen for instant flavour.',
        price: 12,
        image: '/whole_spices.jpg',
        category: 'spices',
        weight: '30g',
        origin: 'Sri Lanka — Kandy Region',
        ingredients: '100% Whole Nutmeg Kernels (Myristica fragrans)',
        shelfLife: '36 months (whole)',
        certifications: ['Non-GMO'],
        variations: [],
        reviews: [],
    },
    {
        id: 'pepper-powder',
        name: 'Black Pepper Powder',
        description: 'Coarse-ground for everyday cooking',
        longDescription: 'Coarse-ground from our premium Tellicherry peppercorns, this powder delivers bold, consistent flavour in every pinch. The coarse grind preserves more volatile oils than fine powder, giving you a more aromatic and flavourful experience.\n\nIdeal for everyday cooking — rubs, marinades, soups, stir-fries, and table seasoning. For best results, add towards the end of cooking or use as a finishing spice.',
        price: 20,
        image: '/ground_powder.jpg',
        category: 'pepper',
        weight: '100g',
        intensity: 75,
        origin: 'Sri Lanka — Matale District',
        ingredients: '100% Coarse-Ground Tellicherry Black Pepper',
        shelfLife: '12 months from packaging',
        certifications: ['Organic'],
        variations: [
            { label: '50g', price: 12, inStock: true },
            { label: '100g', price: 20, inStock: true },
            { label: '250g', price: 44, inStock: true },
        ],
        reviews: [
            { userName: 'Kim T.', rating: 5, comment: 'The coarse grind is perfect. So much more flavourful than anything from the store.' },
        ],
    }
];

const importData = async () => {
    try {
        await connectDB();

        await Order.deleteMany();
        await Product.deleteMany();
        await User.deleteMany();

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Silonka@2026', salt);

        const adminUser = {
            name: 'Admin Silonka',
            email: 'admin@silonka.com',
            password: hashedPassword,
            isAdmin: true,
        };

        await User.insertMany([adminUser]);

        // Compute averageRating and numReviews from seed reviews
        const productsWithRatings = allProducts.map(p => {
            const reviews = p.reviews || [];
            const numReviews = reviews.length;
            const averageRating = numReviews > 0
                ? parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / numReviews).toFixed(1))
                : 0;
            return { ...p, numReviews, averageRating };
        });

        await Product.insertMany(productsWithRatings);

        console.log('Data Imported!');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

importData();
