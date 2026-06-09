import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import Blog from './models/Blog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadImage = async (filePath, publicId) => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: 'silonka/blog',
            public_id: publicId,
            resource_type: 'image',
            overwrite: true,
        });
        console.log(`  ✓ Uploaded: ${publicId}`);
        return result.secure_url;
    } catch (err) {
        console.error(`  ✗ Failed to upload ${publicId}:`, err.message);
        return '';
    }
};

const blogArticles = [
    {
        title: 'What is Ceylon Cinnamon (Cinnamomum verum)?',
        slug: 'what-is-ceylon-cinnamon',
        excerpt: 'Discover the origins, cultivation, and unique qualities of Ceylon Cinnamon — the world\'s most prized "True Cinnamon" from Sri Lanka.',
        content: `Ceylon Cinnamon, often referred to as "True Cinnamon," hails from the bark of the Cinnamomum verum tree, primarily grown in Sri Lanka. Known for its delicate and sweet flavor profile, Ceylon Cinnamon is distinguished by its light brown color and thin, papery texture. Unlike its counterpart, Cassia, Ceylon Cinnamon sticks are soft enough to break by hand and have a crumbly texture. Ceylon cinnamon has been cherished for centuries, not only for its unique taste but also for its numerous health benefits, making it a prized ingredient in culinary and medicinal applications.

## The Art of Cultivation

The cultivation of Ceylon Cinnamon is a meticulous process that involves carefully peeling the inner bark of the tree to create the quills we commonly see in stores. These quills are then dried and rolled into tightly packed sticks. The labor-intensive process of harvesting and preparing Ceylon Cinnamon contributes to its higher cost compared to other types of cinnamon. However, the distinct aroma and flavor of Ceylon Cinnamon make it a worthy investment for those seeking a superior culinary experience.

## Traditional Medicine & Safety

In addition to its culinary uses, Ceylon Cinnamon has been used in traditional medicine for its anti-inflammatory, antioxidant, and antimicrobial properties. It is often recommended for regulating blood sugar levels, improving digestion, and boosting overall immune health. The lower coumarin content in Ceylon Cinnamon makes it a safer option for regular consumption, as high levels of coumarin can be toxic to the liver and kidneys. This attribute further solidifies Ceylon Cinnamon's reputation as the preferred choice for health-conscious individuals.`,
        imageFile: 'blog_ceylon_cinnamon.png',
        imageId: 'ceylon-cinnamon-intro',
        tags: ['Ceylon Cinnamon', 'Spice Guide', 'Sri Lanka'],
        readTime: 6,
        author: 'Silonka Team',
    },
    {
        title: "Nature's Most Powerful Healer: Ceylon Cinnamon",
        slug: 'ceylon-cinnamon-health-benefits',
        excerpt: 'Explore the remarkable health benefits of Ceylon Cinnamon — from blood sugar regulation to immune support and antimicrobial protection.',
        content: `Ceylon Cinnamon is renowned for its numerous health benefits, making it a popular choice among health-conscious individuals. One of the most significant benefits is its ability to regulate blood sugar levels. Studies have shown that Ceylon Cinnamon can improve insulin sensitivity, helping to lower blood sugar levels and reduce the risk of type 2 diabetes. This makes it an excellent dietary supplement for individuals looking to manage their blood sugar levels naturally.

## Rich in Antioxidants

In addition to its blood sugar-regulating properties, Ceylon Cinnamon is also rich in antioxidants, which play a crucial role in protecting the body against oxidative stress and free radical damage. Antioxidants help to reduce inflammation, support the immune system, and promote overall health and well-being. The high antioxidant content of Ceylon Cinnamon makes it an excellent addition to a balanced diet, particularly for those looking to boost their immune health and reduce the risk of chronic diseases.

## Antimicrobial Properties

Ceylon Cinnamon also possesses antimicrobial properties, making it effective in combating various infections and promoting oral health. Its natural antibacterial and antifungal properties can help to prevent the growth of harmful bacteria and fungi, reducing the risk of infections. This makes Ceylon Cinnamon a valuable natural remedy for maintaining oral hygiene and preventing dental issues such as cavities and gum disease. The combination of these health benefits makes Ceylon Cinnamon a powerful and versatile spice that can support overall health and well-being.`,
        imageFile: 'blog_cinnamon_health.png',
        imageId: 'cinnamon-health-benefits',
        tags: ['Health', 'Ceylon Cinnamon', 'Wellness'],
        readTime: 7,
        author: 'Silonka Team',
    },
    {
        title: 'Antioxidant Properties of Ceylon Cinnamon',
        slug: 'antioxidant-properties-ceylon-cinnamon',
        excerpt: 'A deep dive into the powerful antioxidant compounds found in Ceylon cinnamon — polyphenols, flavonoids, and phenolic acids that protect against chronic disease.',
        content: `The antioxidant properties of Ceylon cinnamon are one of its most celebrated health benefits. Antioxidants are compounds that protect the body from oxidative stress, a condition caused by an imbalance between free radicals and antioxidants. Free radicals are unstable molecules that can damage cells, proteins, and DNA, leading to various chronic diseases, including heart disease, cancer, and neurodegenerative disorders. By neutralizing free radicals, antioxidants help to prevent and repair this damage, promoting overall health and longevity.

## Polyphenol Powerhouse

Ceylon cinnamon is particularly rich in polyphenols, a type of antioxidant that has been shown to reduce inflammation and protect against chronic diseases. Polyphenols in Ceylon cinnamon include catechins, procyanidins, and quercetin, all of which have potent anti-inflammatory and immune-boosting properties. These compounds help to reduce oxidative stress in the body, thereby lowering the risk of chronic diseases and improving overall health. The high concentration of these antioxidants in Ceylon cinnamon makes it a valuable addition to a diet aimed at reducing inflammation and boosting the immune system.

## Flavonoids & Phenolic Acids

In addition to polyphenols, Ceylon cinnamon also contains significant amounts of flavonoids and phenolic acid, both of which are known for their strong antioxidant activities. Flavonoids, in particular, have been shown to improve cardiovascular health by reducing blood pressure, improving blood flow, and preventing the formation of blood clots. Phenolic acids, on the other hand, have been linked to a reduced risk of cancer and other chronic diseases. By incorporating Ceylon cinnamon into your diet, you can take advantage of these powerful antioxidants and their numerous health benefits, promoting a healthier and more vibrant life.`,
        imageFile: 'blog_antioxidant.png',
        imageId: 'antioxidant-cinnamon',
        tags: ['Antioxidants', 'Health', 'Ceylon Cinnamon'],
        readTime: 8,
        author: 'Silonka Team',
    },
    {
        title: 'Ceylon Cinnamon vs Cassia Cinnamon',
        slug: 'ceylon-cinnamon-vs-cassia',
        excerpt: 'Not all cinnamon is equal. Learn the critical differences between Ceylon "true" cinnamon and Cassia cinnamon — from coumarin safety to flavor profiles.',
        content: `When it comes to cinnamon, not all varieties are created equal. The two most commonly used types are Ceylon cinnamon and Cassia cinnamon, and while they may appear similar, their health benefits and safety profiles differ significantly. Ceylon cinnamon, often referred to as "true cinnamon," is derived from the Cinnamomum verum tree and is primarily grown in Sri Lanka. Cassia cinnamon, on the other hand, comes from the Cinnamomum cassia tree and is predominantly cultivated in China and Indonesia.

## The Coumarin Difference

One of the main differences between Ceylon and Cassia cinnamon lies in their coumarin content. Coumarin is a naturally occurring compound found in many plants, and while it has some health benefits, high amounts can be harmful. Cassia cinnamon contains much higher levels of coumarin compared to Ceylon cinnamon. Excessive intake of coumarin has been linked to liver damage and an increased risk of cancer. Therefore, consuming large amounts of Cassia cinnamon over time can pose significant health risks. In contrast, Ceylon cinnamon contains only trace amounts of coumarin, making it a safer option for regular consumption.

## Flavor & Culinary Use

Another distinguishing factor is their flavor and texture. Ceylon cinnamon has a delicate, sweet taste and a lighter, finer texture, which makes it a preferred choice for culinary applications that require a subtle and refined flavor. Ceylon cinnamon offers health benefits, and the lower coumarin content and superior flavor profile of Ceylon cinnamon make it the better choice for those looking to enhance their health and culinary experiences.`,
        imageFile: 'blog_ceylon_vs_cassia.png',
        imageId: 'ceylon-vs-cassia',
        tags: ['Ceylon Cinnamon', 'Cassia', 'Comparison', 'Health'],
        readTime: 6,
        author: 'Silonka Team',
    },
    {
        title: "Ceylon Cinnamon's Role in Heart Health",
        slug: 'ceylon-cinnamon-heart-health',
        excerpt: 'Discover how Ceylon cinnamon supports cardiovascular health — from lowering blood pressure and LDL cholesterol to fighting chronic inflammation.',
        content: `Heart health is a major concern for many people, and incorporating Ceylon cinnamon into your diet can be a simple yet effective way to support cardiovascular well-being. Research has shown that Ceylon cinnamon can positively impact several factors related to heart health, including blood pressure, cholesterol levels, and overall heart function. One of the key ways Ceylon cinnamon benefits the heart is through its ability to reduce blood pressure. The antioxidants and anti-inflammatory compounds in Ceylon cinnamon help to relax blood vessels, improve blood flow, and reduce the strain on the heart.

## Cholesterol Management

Ceylon cinnamon has also been shown to lower levels of LDL cholesterol, often referred to as "bad" cholesterol, while simultaneously increasing levels of HDL cholesterol, known as "good" cholesterol. High levels of LDL cholesterol can lead to the buildup of plaque in the arteries, increasing the risk of heart attack and stroke. By lowering LDL cholesterol and increasing HDL cholesterol, Ceylon cinnamon helps to maintain a healthier balance of lipids in the blood, reducing the risk of cardiovascular diseases.

## Anti-Inflammatory Protection

Furthermore, Ceylon cinnamon's anti-inflammatory properties play a crucial role in protecting the heart. Chronic inflammation is a significant risk factor for heart disease, as it can damage the arteries and lead to the development of atherosclerosis, a condition characterized by the hardening and narrowing of the arteries. The anti-inflammatory compounds in Ceylon cinnamon help to reduce inflammation in the body, thereby protecting the arteries and supporting overall heart health. By incorporating Ceylon cinnamon into your diet, you can take proactive steps to maintain a healthy heart and reduce the risk of cardiovascular diseases.`,
        imageFile: 'blog_heart_health.png',
        imageId: 'heart-health-cinnamon',
        tags: ['Heart Health', 'Ceylon Cinnamon', 'Wellness'],
        readTime: 7,
        author: 'Silonka Team',
    },
    {
        title: 'Boost Your Healthy Diet Naturally with Ceylon Cinnamon',
        slug: 'boost-healthy-diet-ceylon-cinnamon',
        excerpt: 'Simple, delicious ways to incorporate Ceylon cinnamon into your daily meals — from breakfast bowls and baking to beverages and savory dishes.',
        content: `Incorporating Ceylon cinnamon into your diet is both simple and versatile, allowing you to enjoy its health benefits in a variety of delicious ways. One of the most common and enjoyable methods is to add ground Ceylon cinnamon to your morning oatmeal or yogurt. This not only enhances the flavor but also provides a nutritious start to your day. You can also sprinkle it on top of fresh fruit, such as apples or bananas, for a sweet and healthy snack.

## Baking & Savory Cooking

Ceylon cinnamon can also be used in baking to create delectable treats with a healthful twist. Adding it to recipes for muffins, cookies, or bread infuses them with a warm, aromatic flavor while boosting their nutritional value. For a savory option, consider adding Ceylon cinnamon to spice rubs or marinades for meats and vegetables. Its subtle sweetness pairs well with a variety of spices, enhancing the overall flavor profile of your dishes.

## Beverages & Daily Routines

Beverages provide another excellent opportunity to incorporate Ceylon cinnamon into your diet. Stirring a teaspoon of ground Ceylon cinnamon into your coffee, tea, or smoothie can add a delightful flavor and provide a healthful boost. By exploring various methods, you can seamlessly integrate Ceylon cinnamon into your daily routine and reap its numerous health benefits.`,
        imageFile: 'blog_healthy_diet.png',
        imageId: 'healthy-diet-cinnamon',
        tags: ['Recipes', 'Healthy Living', 'Ceylon Cinnamon'],
        readTime: 5,
        author: 'Silonka Team',
    },
    {
        title: 'Ceylon Cinnamon and Diabetes Management',
        slug: 'ceylon-cinnamon-diabetes',
        excerpt: 'How Ceylon cinnamon helps regulate blood sugar levels — the science behind insulin sensitivity, glucose metabolism, and natural diabetes support.',
        content: `One of the most well-researched benefits of Ceylon cinnamon is its ability to help regulate blood sugar levels. This is particularly beneficial for individuals with type 2 diabetes or those at risk of developing the condition. Several studies have shown that Ceylon cinnamon can improve insulin sensitivity, allowing the body to use insulin more effectively. Improved insulin sensitivity helps to lower blood sugar levels and prevent the spikes and crashes that can be harmful to overall health.

## How It Works

Ceylon cinnamon contains compounds that mimic insulin and increase glucose uptake by cells. These compounds help to reduce blood sugar levels by enhancing the body's ability to store and use glucose efficiently. By improving glucose metabolism, Ceylon cinnamon can help to reduce the risk of insulin resistance, a condition that often precedes type 2 diabetes. Regular consumption of Ceylon cinnamon has been shown to lower fasting blood sugar levels and improve overall glycemic control, making it a valuable tool for managing diabetes.

## Fighting Diabetic Inflammation

In addition to its effects on blood sugar, Ceylon cinnamon also has anti-inflammatory properties that can help to reduce inflammation associated with diabetes. Chronic inflammation is a common issue for individuals with diabetes, as it can exacerbate insulin resistance and lead to further complications. The anti-inflammatory compounds in Ceylon cinnamon help to reduce this inflammation, supporting overall metabolic health. By incorporating Ceylon cinnamon into your diet, you can take advantage of its blood sugar-regulating properties and support a healthier, more balanced metabolism.`,
        imageFile: 'blog_diabetes.png',
        imageId: 'diabetes-cinnamon',
        tags: ['Diabetes', 'Blood Sugar', 'Health', 'Ceylon Cinnamon'],
        readTime: 7,
        author: 'Silonka Team',
    },
    {
        title: "The Black Gold: World's Finest Pepper",
        slug: 'ceylon-black-pepper-black-gold',
        excerpt: 'Why Ceylon black pepper is considered the finest in the world — its unique terroir, high piperine content, and the meticulous processing that sets it apart.',
        content: `Ceylon black pepper stands out for its distinctive qualities that set it apart from other varieties. One of the key factors contributing to its uniqueness is the terroir, or the specific environmental conditions in which it is grown. The lush, tropical climate of Sri Lanka, combined with the island's rich, loamy soil, creates the ideal environment for cultivating black pepper with a complex flavor profile. The peppercorns are carefully harvested by hand at the peak of ripeness, ensuring that they retain their robust aroma and sharp, spicy taste.

## High Piperine Content

Another characteristic that distinguishes Ceylon black pepper is its high piperine content. Piperine is the alkaloid responsible for the pungency and heat of black pepper. Ceylon black pepper is known for its higher concentration of piperine compared to other varieties, which not only enhances its flavor but also contributes to its numerous health benefits. The meticulous processing methods used in Sri Lanka, including sun-drying the peppercorns, help preserve their natural oils and volatile compounds, resulting in a superior product with an intense and aromatic profile.

## Visual Quality & Grading

The visual appeal of Ceylon black pepper is also noteworthy. The peppercorns are typically larger and more uniform in size, with a deep, glossy black color. This not only makes them visually striking but also indicates their high quality. The careful selection and grading of the peppercorns ensure that only the best ones make it to the market, maintaining the reputation of Ceylon spices for excellence. Whether used whole, cracked, or ground, Ceylon black pepper adds a distinctive and sophisticated touch to a wide range of culinary creations.`,
        imageFile: 'blog_black_pepper.png',
        imageId: 'black-gold-pepper',
        tags: ['Black Pepper', 'Ceylon Spices', 'Sri Lanka'],
        readTime: 6,
        author: 'Silonka Team',
    },
    {
        title: 'The Queen of Spices: Ceylon Cardamom',
        slug: 'ceylon-cardamom-queen-of-spices',
        excerpt: 'Explore the exquisite qualities of Ceylon cardamom — its complex flavor, vibrant green pods, and why it\'s revered as the "Queen of Spices" worldwide.',
        content: `Ceylon cardamom, often referred to as the "Queen of Spices," is renowned for its unique and exquisite qualities. Grown in the lush, tropical highlands of Sri Lanka, Ceylon cardamom is prized for its vibrant green pods and intense aroma. The specific microclimate of Sri Lanka, with its rich, loamy soil and consistent rainfall, provides the perfect conditions for cultivating cardamom with a distinct flavor profile. The pods are meticulously harvested by hand, ensuring that they are picked at the optimal stage of ripeness to retain their full aromatic potential.

## Complex Flavor Profile

One of the most distinctive qualities of Ceylon cardamom is its complex and well-balanced flavor. The spice has a sweet, floral aroma with hints of citrus and eucalyptus, making it a versatile ingredient in both savory and sweet dishes. The flavor of Ceylon cardamom is more delicate and nuanced compared to other varieties, which allows it to enhance dishes without overpowering other ingredients. This subtlety and sophistication make Ceylon cardamom a favorite among chefs and culinary enthusiasts around the world.

## Visual Appeal & Quality

The visual appeal of Ceylon cardamom adds to its allure. The pods are typically larger, plumper, and more vibrant in color compared to other types of cardamom. This not only indicates their high quality but also makes them an attractive addition to various dishes and culinary presentations. The meticulous grading and selection process ensures that only the finest pods are marketed, maintaining the reputation of Ceylon cardamom for excellence. Whether used whole, ground, or as an infused extract, Ceylon cardamom imparts a distinctive and luxurious flavor to any culinary creation.`,
        imageFile: 'blog_cardamom.png',
        imageId: 'queen-cardamom',
        tags: ['Cardamom', 'Ceylon Spices', 'Sri Lanka'],
        readTime: 6,
        author: 'Silonka Team',
    },
];

const seedBlogs = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Clear existing blog posts
        await Blog.deleteMany({});
        console.log('Cleared existing blog posts');

        // Upload images and create posts
        const uploadsDir = path.join(__dirname, 'uploads');

        for (let i = 0; i < blogArticles.length; i++) {
            const article = blogArticles[i];
            console.log(`\n[${i + 1}/${blogArticles.length}] ${article.title}`);

            // Upload image to Cloudinary
            let imageUrl = '';
            const imagePath = path.join(uploadsDir, article.imageFile);
            if (fs.existsSync(imagePath)) {
                imageUrl = await uploadImage(imagePath, article.imageId);
            } else {
                console.log(`  ⚠ Image not found: ${article.imageFile}`);
            }

            // Create blog post
            await Blog.create({
                title: article.title,
                slug: article.slug,
                excerpt: article.excerpt,
                content: article.content,
                image: imageUrl,
                tags: article.tags,
                published: true,
                author: article.author,
                readTime: article.readTime,
            });

            console.log(`  ✓ Created: ${article.slug}`);
        }

        console.log(`\n✅ Successfully seeded ${blogArticles.length} blog articles!`);
        process.exit(0);
    } catch (error) {
        console.error('Error seeding blogs:', error.message);
        process.exit(1);
    }
};

seedBlogs();
