/* Unit test for pure antenna calc logic. Run via tsc (commonjs) + node. */
import { computeLength, resonantBands } from "../src/antenna/antenna";

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

// --- Forward: length ---
check("λ/4 coeff ~71.25", near(computeLength(1, "1/4", null, 0.95)!, 71.25));
check("λ/2 coeff ~142.5", near(computeLength(1, "1/2", null, 0.95)!, 142.5));
check("5/8 coeff ~178.13", near(computeLength(1, "5/8", null, 0.95)!, 178.125));
check("1λ stretched ~285.0", near(computeLength(1, "1/1", "stretched", 0.95)!, 285.0));
check("1λ loop fixed 306.3", near(computeLength(1, "1/1", "loop", 0.95)!, 306.3));
check("loop ignores VF", computeLength(1, "1/1", "loop", 0.8) === computeLength(1, "1/1", "loop", 0.99));
check("λ/2 @14.2 ~10.04m", near(computeLength(14.2, "1/2", null, 0.95)!, 10.035, 0.01));
check("invalid freq -> null", computeLength(0, "1/2", null, 0.95) === null);

// --- Reverse: bands ---
// ~10.03 m half-wave for 20 m: resonant on 20 m (n=1) and 10 m (n=2).
const b20 = resonantBands(10.03, 0.95);
const names20 = b20.map((h) => h.band);
check("10.03m -> 20m present", names20.includes("20 m"), names20.join(","));
check("10.03m -> 10m present (2nd harmonic)", names20.includes("10 m"), names20.join(","));

// ~20.07 m (40 m half-wave): 40, 20, 15, 10.
const b40 = resonantBands(20.07, 0.95);
const names40 = b40.map((h) => h.band);
check("20.07m -> 40m", names40.includes("40 m"), names40.join(","));
check("20.07m -> 20m", names40.includes("20 m"), names40.join(","));
check("20.07m -> 15m", names40.includes("15 m"), names40.join(","));
check("20.07m -> 10m", names40.includes("10 m"), names40.join(","));
check("first hit is fundamental n=1", b40.length > 0 && b40[0].harmonic === 1);

check("empty length -> []", resonantBands(0, 0.95).length === 0);

console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
