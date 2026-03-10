import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const categories = [
    { name: "ჭურჭელი", slug: "tableware", image: "/images/placeholder-tableware.jpg" },
    { name: "ავეჯი", slug: "furniture", image: "/images/placeholder-furniture.jpg" },
    { name: "დეკორაცია", slug: "decor", image: "/images/placeholder-decor.jpg" },
    { name: "ტექსტილი", slug: "textile", image: "/images/placeholder-textile.jpg" },
    { name: "განათება", slug: "lighting", image: "/images/placeholder-lighting.jpg" },
    { name: "სხვადასხვა", slug: "misc", image: "/images/placeholder-misc.jpg" },
];

// Only use Google Drive or local images
const products = [
    {
        name: "ოქროსფერი სკამი 'Tiffany'",
        description: "ელეგანტური ოქროსფერი სკამი, იდეალურია ქორწილებისა და ბანკეტებისთვის. მოყვება თეთრი ბალიში.",
        price: 12.00,
        categorySlug: "furniture",
        isFeatured: true,
        images: JSON.stringify(["/images/chair-gold.jpg", "/images/chair-gold-2.jpg"])
    },
    {
        name: "ხის მაგიდა 'Rustic'",
        description: "ნატურალური ხის მასიური მაგიდა, 10 პერსონაზე. იდეალურია გარე ღონისძიებებისთვის.",
        price: 150.00,
        categorySlug: "furniture",
        isFeatured: true,
        images: JSON.stringify(["/images/table-rustic.jpg"])
    },
    {
        name: "თეფშების კომპლექტი 'Royal'",
        description: "პრემიუმ კლასის ფაიფურის თეფშები ოქროს კანტით. კომპლექტში შედის: ძირითადი, სასუპე და სადესერტო თეფშები.",
        price: 5.50,
        categorySlug: "tableware",
        isFeatured: true,
        images: JSON.stringify(["/images/plates-royal.jpg"])
    },
    {
        name: "ვერცხლისფერი დანა-ჩანგალი",
        description: "მაღალი ხარისხის უჟანგავი ფოლადის დანა-ჩანგლის ნაკრები.",
        price: 2.00,
        categorySlug: "tableware",
        isFeatured: false,
        images: JSON.stringify(["/images/cutlery-silver.jpg"])
    },
    {
        name: "ბროლის ჭიქები",
        description: "ღვინის და შამპანურის ბროლის ჭიქები.",
        price: 3.00,
        categorySlug: "tableware",
        isFeatured: false,
        images: JSON.stringify(["/images/glasses-crystal.jpg"])
    },
    {
        name: "ვარდების თაღი",
        description: "ხელოვნური და ცოცხალი ყვავილებით გაფორმებული თაღი ფოტოსესიისთვის.",
        price: 350.00,
        categorySlug: "decor",
        isFeatured: true,
        images: JSON.stringify(["/images/arch-roses.jpg"])
    },
    {
        name: "მაგიდის გადასაფარებელი (ხავერდი)",
        description: "მუქი მწვანე ხავერდის გადასაფარებელი, 3 მეტრიანი.",
        price: 45.00,
        categorySlug: "textile",
        isFeatured: false,
        images: JSON.stringify(["/images/cloth-velvet.jpg"])
    }
];

async function main() {
    console.log('Start seeding ...');

    // Clear existing data
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();

    // Create Categories
    for (const cat of categories) {
        await prisma.category.create({
            data: cat,
        });
        console.log(`Created category: ${cat.name}`);
    }

    // Create Products
    for (const product of products) {
        const { categorySlug, ...rest } = product;

        const category = await prisma.category.findUnique({
            where: { slug: categorySlug },
        });

        if (category) {
            await prisma.product.create({
                data: {
                    ...rest,
                    categoryId: category.id,
                },
            });
            console.log(`Created product: ${product.name}`);
        }
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
