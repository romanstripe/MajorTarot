const fs = require('fs');
const csv = require('csv-parser');

function processCSVFile(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        // Process each row
        if (data.categories && data.value1 && data.value2 && data.content) {
          results.push({
            category: data.categories,
            card: data.value1,
            direction: data.value2,
            content: data.content,
            type: data.types || `${data.value1} ${data.value2}`
          });
        }
      })
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

async function processTarotData() {
  try {
    console.log('Processing tarot data files...');
    
    // Process all CSV files
    const [trainData, testData, validData] = await Promise.all([
      processCSVFile('../tarot_data/train.csv'),
      processCSVFile('../tarot_data/test.csv'),
      processCSVFile('../tarot_data/valid.csv')
    ]);
    
    // Combine all data
    const allResults = [...trainData, ...testData, ...validData];
    
    // Remove duplicates based on category, card, and direction
    const uniqueResults = allResults.filter((item, index, self) =>
      index === self.findIndex((t) => (
        t.category === item.category && 
        t.card === item.card && 
        t.direction === item.direction
      ))
    );
    
    // Get unique categories for search
    const categories = [...new Set(uniqueResults.map(row => row.category))];
    
    // Get all unique cards
    const cards = [...new Set(uniqueResults.map(row => row.card).filter(v => v))];
    
    // Organize data by category for easier lookup
    const organizedData = {};
    categories.forEach(category => {
      organizedData[category] = uniqueResults.filter(row => row.category === category);
    });
    
    const processedData = {
      categories,
      cards,
      totalEntries: uniqueResults.length,
      data: organizedData,
      allData: uniqueResults
    };
    
    // Write processed data to JSON file
    fs.writeFileSync('./src/data/tarot-data.json', JSON.stringify(processedData, null, 2));
    
    console.log('Data processing complete!');
    console.log(`Total entries: ${uniqueResults.length}`);
    console.log(`Unique categories: ${categories.length}`);
    console.log(`Unique cards: ${cards.length}`);
    console.log('Sample categories:', categories.slice(0, 10));
    
    return processedData;
  } catch (error) {
    console.error('Error processing data:', error);
    throw error;
  }
}

processTarotData().catch(console.error);
