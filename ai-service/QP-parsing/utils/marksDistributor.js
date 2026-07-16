
//this module contains functions that takes question json as input and manipulates that json such that if the marks of all
//the leaf nodes are empty then the extractedTotalMarks are distributed equally among all the leaf question nodes.


// Recursively collects all leaf nodes under a given question node.

function collectLeafNodes(node, leaves = []) {
    if (!node.children || node.children.length === 0) {
        leaves.push(node);
    } else {
        for (const child of node.children) {
            collectLeafNodes(child, leaves);
        }
    }
    return leaves;
}

export default function marksDistributor(data){
    if (!data || !Array.isArray(data.sections)) {
        return false; 
    }
    for (const section of data.sections) {
        if (!Array.isArray(section.questions)) continue;

        for (const question of section.questions) {
            // Only process questions with nested sub-questions
            if (question.children && question.children.length > 0) {
                
                const leafNodes = collectLeafNodes(question);
                if (leafNodes.length === 0) continue;

                // Count how many leaf nodes have empty marks vs. filled marks
                const emptyCount = leafNodes.filter(leaf => leaf.marks === "").length;
                const totalLeaves = leafNodes.length;

                // CASE 1: Inconsistent/Inaccurate values detected
                // (e.g., out of 3 subparts, 1 has "5" marks and 2 are empty "")
                if (emptyCount > 0 && emptyCount < totalLeaves) {
                    console.warn(`Inconsistent marks detected in question ${question.id}. Some subparts have marks while others are empty.`);
                    return false; // Safely aborts the entire helper and flags failure
                }

                // CASE 2: All subparts are empty. We must distribute the parent's total.
                if (emptyCount === totalLeaves) {
                    if (!question.extractedTotalMarks) {
                        // If children are empty and there is no parent total, we can't distribute.
                        console.warn(`Question ${question.id} has empty subpart marks but no parent total marks to distribute.`);
                        return false; 
                    }

                    const totalMarks = Number(question.extractedTotalMarks);
                    if (isNaN(totalMarks) || totalMarks <= 0) {
                        return false; 
                    }

                    const distributedMarks = totalMarks / totalLeaves;
                    const marksString = Number.isInteger(distributedMarks) 
                        ? distributedMarks.toString() 
                        : distributedMarks.toFixed(1);

                    for (const leaf of leafNodes) {
                        leaf.marks = marksString;
                    }
                }
                
                // CASE 3: All subparts already have marks (emptyCount === 0). 
                // We leave them exactly as they are.
            }
        }
    }
    return data; //successfully checked the whole json and distributed marks to children nodes if empty.
}