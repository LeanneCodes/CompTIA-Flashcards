const fs = require('fs').promises;
const path = require('path');

// Define the paths relative to where you run the script
const MAIN_QUESTIONS_FILE = path.join(__dirname, 'questions.json');
const BASE_QUIZZES_DIR = path.join(__dirname, 'questions'); // The 'questions' folder containing 'network', 'security', etc.

async function updateAllCategoryQuizzes() {
    console.log('Starting comprehensive quiz data update process...');

    let mainQuizData;

    try {
        // 1. Read the main questions.json file
        const mainFileContent = await fs.readFile(MAIN_QUESTIONS_FILE, 'utf8');
        mainQuizData = JSON.parse(mainFileContent);
        console.log('Successfully loaded main questions.json');
    } catch (err) {
        console.error(`Error reading or parsing ${MAIN_QUESTIONS_FILE}:`, err.message);
        return; // Exit if main file cannot be read
    }

    // 2. Iterate through each category in mainQuizData
    if (!mainQuizData.categories || !Array.isArray(mainQuizData.categories)) {
        console.error("Error: 'categories' array not found or is invalid in questions.json. Exiting.");
        return;
    }

    for (const category of mainQuizData.categories) {
        const categoryName = category.name;
        // Construct the path to the subfolder for this category (e.g., 'questions/network', 'questions/security')
        const categoryQuizzesDir = path.join(BASE_QUIZZES_DIR, categoryName.toLowerCase()); // Assuming folder names are lowercase versions of category names

        console.log(`\n--- Processing category: '${categoryName}' ---`);

        // Ensure subcategories array exists and is properly initialized for the current category
        if (!category.subcategories) {
            category.subcategories = [];
        } else {
            // Remove the initial empty object if it exists (e.g., [{}])
            // This is a common pattern for initial empty arrays in JSON structures.
            if (category.subcategories.length === 1 && Object.keys(category.subcategories[0]).length === 0) {
                category.subcategories = [];
                console.log(`  Removed empty placeholder from '${categoryName}' subcategories.`);
            }
        }
        
        const initialSubcategoryCount = category.subcategories.length;
        console.log(`  Initial '${categoryName}' subcategories count: ${initialSubcategoryCount}`);

        try {
            // Check if the category's quiz directory actually exists
            const dirExists = await fs.stat(categoryQuizzesDir).then(stat => stat.isDirectory()).catch(() => false);

            if (!dirExists) {
                console.warn(`  Directory '${categoryQuizzesDir}' does not exist or is not a directory. Skipping this category.`);
                continue; // Move to the next category
            }

            // 3. Read all JSON files from the category's directory
            const filesInDir = await fs.readdir(categoryQuizzesDir);
            const jsonQuizFiles = filesInDir.filter(file => path.extname(file).toLowerCase() === '.json');
            
            console.log(`  Found ${jsonQuizFiles.length} JSON files in '${categoryQuizzesDir}'`);

            if (jsonQuizFiles.length === 0) {
                console.log(`  No JSON quiz files found in '${categoryQuizzesDir}'. No new subcategories added for '${categoryName}'.`);
                continue; // Move to the next category
            }

            const readAndParsePromises = jsonQuizFiles.map(async (fileName) => {
                const filePath = path.join(categoryQuizzesDir, fileName);
                try {
                    const fileContent = await fs.readFile(filePath, 'utf8');
                    const parsedData = JSON.parse(fileContent);
                    // Assuming each file is an array containing a single subcategory object: [ { name: "...", quizzes: [...] } ]
                    if (Array.isArray(parsedData) && parsedData.length > 0 && parsedData[0].name && parsedData[0].quizzes) {
                        return parsedData[0]; // Return the subcategory object
                    } else {
                        console.warn(`  Skipping ${fileName}: Does not match expected subcategory format (Expected [{ name: "...", quizzes: [...] }]).`);
                        return null;
                    }
                } catch (err) {
                    console.error(`  Error processing ${filePath}:`, err.message);
                    return null;
                }
            });

            // Wait for all files in the current category to be read and parsed
            const newSubcategories = (await Promise.all(readAndParsePromises)).filter(Boolean); // Filter out any nulls from errors/warnings

            // 4. Append each parsed subcategory to the current category's subcategories
            for (const subcategory of newSubcategories) {
                // Optional: Prevent adding duplicates if you re-run the script
                const exists = category.subcategories.some(s => s.name === subcategory.name);
                if (!exists) {
                    category.subcategories.push(subcategory);
                    console.log(`  Appended subcategory: '${subcategory.name}'`);
                } else {
                    console.log(`  Subcategory '${subcategory.name}' already exists in '${categoryName}'. Skipping.`);
                }
            }
            
            console.log(`  Finished appending for '${categoryName}'. Total subcategories: ${category.subcategories.length}`);

        } catch (err) {
            console.error(`An error occurred while processing category '${categoryName}':`, err);
        }
    }

    // 5. Write the entire updated data back to questions.json
    try {
        await fs.writeFile(MAIN_QUESTIONS_FILE, JSON.stringify(mainQuizData, null, 2), 'utf8');
        console.log('\nAll categories processed. Updated questions.json saved successfully!');
    } catch (err) {
        console.error('Error writing updated questions.json:', err.message);
    }
}

// Execute the update function
updateAllCategoryQuizzes();