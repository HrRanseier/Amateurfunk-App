/* Unit test for pure antenna calc logic. Run via tsc (commonjs) + node. */
import { computeLength, feedConfig, matchingDevice } from "../src/antenna/antenna";

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean, extra?: string) {
  if (cond) {
    pass++;
    console.log("PASS:", name);
  } else {
    fail++;
    console.log("FAIL:", name, extra ?? "");
  }
}
function near(a: number, b: number, eps = 0.01) {
  return Math.abs(a - b) <= eps;
}

// Length coefficients at f=1 MHz (so result == coefficient), VF=0.95.
check("λ/4 coeff ~71.25", near(computeLength(1, "1/4", null, 0.95)!, 71.25), String(computeLength(1, "1/4", null, 0.95)));
check("λ/2 coeff ~142.5", near(computeLength(1, "1/2", null, 0.95)!, 142.5), String(computeLength(1, "1/2", null, 0.95)));
check("5/8 coeff ~178.13", near(computeLength(1, "5/8", null, 0.95)!, 178.125), String(computeLength(1, "5/8", null, 0.95)));
check("1λ stretched ~285.0", near(computeLength(1, "1/1", "stretched", 0.95)!, 285.0), String(computeLength(1, "1/1", "stretched", 0.95)));
check("1λ loop fixed 306.3", near(computeLength(1, "1/1", "loop", 0.95)!, 306.3), String(computeLength(1, "1/1", "loop", 0.95)));

// Loop ignores VF (fixed formula).
check("loop ignores VF", computeLength(1, "1/1", "loop", 0.8) === computeLength(1, "1/1", "loop", 0.99));

// Real example f=14.2 MHz, λ/2.
check("λ/2 @14.2 ~10.04m", near(computeLength(14.2, "1/2", null, 0.95)!, 10.035, 0.01), String(computeLength(14.2, "1/2", null, 0.95)));

// Feed config locking.
check("λ/4 feed locked vertical", feedConfig("1/4", null).locked && feedConfig("1/4", null).options[0] === "vertical");
check("5/8 feed locked vertical", feedConfig("5/8", null).locked && feedConfig("5/8", null).options[0] === "vertical");
check("λ/2 feed choice (dipole/efhw)", !feedConfig("1/2", null).locked && feedConfig("1/2", null).options.length === 2);
check("1λ stretched locked endfed", feedConfig("1/1", "stretched").locked && feedConfig("1/1", "stretched").options[0] === "endfed1l");
check("1λ loop choice (2 opts)", !feedConfig("1/1", "loop").locked && feedConfig("1/1", "loop").options.length === 2);

// Matching device strings.
check("5/8 vertical adds Anpassspule", matchingDevice("vertical", "5/8").includes("Anpassspule"));
check("λ/4 vertical no Anpassspule", !matchingDevice("vertical", "1/4").includes("Anpassspule"));
check("dipole 1:1 Balun", matchingDevice("dipole", "1/2").includes("1:1 Balun"));
check("efhw 49:1 Unun", matchingDevice("efhw", "1/2").includes("49:1 Unun"));
check("endfed1l 49:1 Unun", matchingDevice("endfed1l", "1/1").includes("49:1 Unun"));
check("loopCenter 4:1 Balun", matchingDevice("loopCenter", "1/1").includes("4:1 Balun"));
check("loopCorner 1:1 Balun 50", matchingDevice("loopCorner", "1/1").includes("1:1 Balun") && matchingDevice("loopCorner", "1/1").includes("50"));

console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
