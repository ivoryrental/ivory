import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// External domains to remove (not Google Drive)
const externalDomains = [
  'ecorent.ge',
  'upliteventhire.co.uk',
  'trasa.ge',
  'manufactum.de',
  'tripzaza.com',
  'gstatic.com',
  'pinimg.com',
  'amazon.com',
  'gettyimages.com',
  'valarflowers.com',
  'yt3.ggpht.com',
  'media-amazon.com',
  'unsplash.com',
  'pexels.com',
  'youtube.com',
  'youtu.be',
  'facebook.com',
  'instagram.com',
];

async function hasExternalImage(product) {
  try {
    const images = JSON.parse(product.images || '[]');
    if (!Array.isArray(images)) return false;
    
    return images.some(url => {
      if (!url || typeof url !== 'string') return false;
      // Keep local images
      if (url.startsWith('/')) return false;
      // Keep Google Drive images
      if (url.includes('drive.google.com') || url.includes('googleusercontent.com')) return false;
      // Check for external domains
      return externalDomains.some(domain => url.includes(domain));
    });
  } catch {
    return false;
  }
}

async function main() {
  console.log('Fetching all products...');
  const products = await prisma.product.findMany();
  
  const toDelete = [];
  const toKeep = [];
  
  for (const product of products) {
    if (await hasExternalImage(product)) {
      toDelete.push(product);
    } else {
      toKeep.push(product);
    }
  }
  
  console.log(`\nFound ${products.length} total products:`);
  console.log(`- ${toKeep.length} products with Google Drive/local images (KEEPING)`);
  console.log(`- ${toDelete.length} products with external images (DELETING)\n`);
  
  if (toDelete.length > 0) {
    console.log('Products to delete:');
    for (const p of toDelete) {
      console.log(`  - "${p.name}" (images: ${p.images})`);
    }
    
    console.log('\nDeleting...');
    for (const p of toDelete) {
      await prisma.product.delete({ where: { id: p.id } });
      console.log(`  ✓ Deleted: "${p.name}"`);
    }
    console.log(`\n✅ Deleted ${toDelete.length} products successfully!`);
  } else {
    console.log('No products with external images found.');
  }
  
  console.log(`\nRemaining products: ${toKeep.length}`);
  for (const p of toKeep) {
    console.log(`  - "${p.name}" (images: ${p.images})`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
