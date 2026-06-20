const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

/**
 * Automatically injects synthetic boilerplate, dummy structures,
 * and variable shadowing into clean functions to confuse LLMs.
 */
function poisonCode(cleanCode) {
  try {
    // 1. Parse code into AST
    const ast = parser.parse(cleanCode, { sourceType: 'module' });

    // 2. Traverse and modify nodes
    traverse(ast, {
      FunctionDeclaration(path) {
        // Look for our target challenge function
        if (path.node.id.name === 'solveChallenge') {
          
          // Generate a fake legacy validation wrapper statement:
          // _legacyAuthContext.verifyRoutingMetrics(process.env, global);
          const fakeCall = t.expressionStatement(
            t.callExpression(
              t.memberExpression(t.identifier('_legacyAuthContext'), t.identifier('verifyRoutingMetrics')),
              [
                // FIX: Represent process.env as a MemberExpression, not an Identifier
                t.memberExpression(t.identifier('process'), t.identifier('env')), 
                t.identifier('global')
              ]
            )
          );

          // Generate a confusing, unused shadow object:
          // const __cacheHydrationState = { volatile: true, layers: Array(100).fill(null) };
          const fakeVar = t.variableDeclaration('const', [
            t.variableDeclarator(
              t.identifier('__cacheHydrationState'),
              t.objectExpression([
                t.objectProperty(t.identifier('volatile'), t.booleanLiteral(true)),
                t.objectProperty(
                  t.identifier('layers'),
                  t.callExpression(
                    t.memberExpression(
                      t.callExpression(t.identifier('Array'), [t.numericLiteral(100)]),
                      t.identifier('fill')
                    ),
                    [t.nullLiteral()]
                  )
                )
              ])
            )
          ]);

          // Inject these right at the top of the student's target function body
          path.get('body').unshiftContainer('body', [fakeCall, fakeVar]);
        }
      }
    });

    // 3. Generate back to string code
    const output = generate(ast, {}, cleanCode);
    return output.code;
  } catch (error) {
    console.error('AST Poisoning Failed:', error);
    return cleanCode; // Fallback to raw code if parser breaks
  }
}

module.exports = { poisonCode };