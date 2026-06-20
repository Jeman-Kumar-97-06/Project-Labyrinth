// backend/executor.js

function buildJsPayload(candidateCode, testCases) {
  return `
${candidateCode}

const tests = ${JSON.stringify(testCases)};
let passed = 0;
const results = tests.map((test, index) => {
  try {
    const output = solveChallenge(test.input);
    const isPass = JSON.stringify(output) === JSON.stringify(test.expected);
    if (isPass) passed++;
    return { testNumber: index + 1, status: isPass ? 'PASS' : 'FAIL', expected: test.expected, actual: output };
  } catch (err) {
    return { testNumber: index + 1, status: 'ERROR', error: err.message };
  }
});

console.log(JSON.stringify({ totalTests: tests.length, passed, details: results }));
`;
}

function buildPythonPayload(candidateCode, testCases) {
  return `
import json
import sys

${candidateCode}

def run_tests():
    tests = ${JSON.stringify(testCases)}
    passed = 0
    results = []
    
    for i, test in enumerate(tests):
        try:
            output = solveChallenge(test['input'])
            is_pass = str(output) == str(test['expected'])
            if is_pass: passed += 1
            results.append({
                "testNumber": i + 1, "status": "PASS" if is_pass else "FAIL",
                "expected": test['expected'], "actual": output
            })
        except Exception as e:
            results.append({"testNumber": i + 1, "status": "ERROR", "error": str(e)})
            
    print(json.dumps({"totalTests": len(tests), "passed": passed, "details": results}))

if __name__ == "__main__":
    run_tests()
`;
}

function buildCPayload(candidateCode, testCases) {
  // C is strictly typed, so for an MVP testing integers, we hardcode the array logic.
  // We manually print JSON formatting since C has no native JSON library.
  return `
#include <stdio.h>
#include <stdlib.h>

${candidateCode}

int main() {
    int passed = 0;
    int total = 3;
    
    // Test 1: [1, 2, 4, 5] -> 3
    int arr1[] = {1, 2, 4, 5};
    int res1 = solveChallenge(arr1, 4);
    if (res1 == 3) passed++;

    // Test 2: [1, 2, 3, 4, 6] -> 5
    int arr2[] = {1, 2, 3, 4, 6};
    int res2 = solveChallenge(arr2, 5);
    if (res2 == 5) passed++;

    // Test 3: [2, 3, 4] -> 1
    int arr3[] = {2, 3, 4};
    int res3 = solveChallenge(arr3, 3);
    if (res3 == 1) passed++;

    printf("{\\"totalTests\\": %%d, \\"passed\\": %%d, \\"details\\": [", total, passed);
    printf("{\\"testNumber\\": 1, \\"status\\": \\"%%s\\"},", res1 == 3 ? "PASS" : "FAIL");
    printf("{\\"testNumber\\": 2, \\"status\\": \\"%%s\\"},", res2 == 5 ? "PASS" : "FAIL");
    printf("{\\"testNumber\\": 3, \\"status\\": \\"%%s\\"}", res3 == 1 ? "PASS" : "FAIL");
    printf("]}\\n");

    return 0;
}
`;
}

async function runPolyglotTests(candidateCode, testCases, language) {
  let finalPayload = '';
  let compilerLang = '';
  let ext = '';

  if (language === 'javascript') {
    finalPayload = buildJsPayload(candidateCode, testCases);
    compilerLang = 'nodejs';
    ext = 'js';
  } else if (language === 'python') {
    finalPayload = buildPythonPayload(candidateCode, testCases);
    compilerLang = 'python';
    ext = 'py';
  } else if (language === 'c') {
    finalPayload = buildCPayload(candidateCode, testCases);
    compilerLang = 'c';
    ext = 'c';
  }

  try {
    const response = await fetch('https://api.onecompiler.com/v1/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.ONE_COMPILER,
      },
      body: JSON.stringify({
        language: compilerLang,
        stdin: "",
        files: [{ name: `main.${ext}`, content: finalPayload }]
      })
    });

    const data = await response.json();

    if (data.stdout) {
      return JSON.parse(data.stdout); // Parse the printed JSON from our wrappers
    } else {
      return { totalTests: testCases.length, passed: 0, details: [{ status: "ERROR", error: data.stderr || "Compilation failed" }] };
    }
  } catch (error) {
    console.error("Execution Error:", error);
    return { error: "Failed to reach execution server" };
  }
}

module.exports = { runPolyglotTests };