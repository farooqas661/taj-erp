/**
 * Migrate existing employee passwords from plain text to bcrypt hashes.
 *
 * Usage:
 *   npm run migrate:passwords
 *
 * After secure RLS is applied, set SUPABASE_SERVICE_ROLE_KEY in .env
 * (Dashboard → Settings → API → service_role). Never expose that key
 * in the frontend.
 *
 * Falls back to VITE_SUPABASE_ANON_KEY only for pre-RLS databases.
 */

import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

const SALT_ROUNDS = 10;

const isHashedPassword = (value) =>
  typeof value === "string" && /^\$2[aby]\$/.test(value);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Missing VITE_SUPABASE_URL and a key (SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY) in .env"
  );
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "WARNING: Using anon key. After secure-rls.sql is applied, set SUPABASE_SERVICE_ROLE_KEY."
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

const migratePasswords = async () => {
  console.log("Fetching employees...");

  const { data: employees, error } = await supabase
    .from("employees")
    .select("id, employee_id, password");

  if (error) {
    console.error("Failed to fetch employees:", error.message);
    process.exit(1);
  }

  if (!employees?.length) {
    console.log("No employees found.");
    return;
  }

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const employee of employees) {
    const stored = employee.password;

    if (!stored || stored === "REDACTED") {
      console.log(
        `SKIP  ${employee.employee_id} (no migratable password on employees row)`
      );
      skipped += 1;
      continue;
    }

    if (isHashedPassword(stored)) {
      // Writing the hash again syncs it into employee_secrets via trigger
      const { error: syncError } = await supabase
        .from("employees")
        .update({ password: stored })
        .eq("id", employee.id);

      if (syncError) {
        console.error(
          `FAIL  ${employee.employee_id}: ${syncError.message}`
        );
        failed += 1;
        continue;
      }

      console.log(`SYNC  ${employee.employee_id} (already hashed)`);
      skipped += 1;
      continue;
    }

    const hashed = await bcrypt.hash(String(stored), SALT_ROUNDS);

    const { error: updateError } = await supabase
      .from("employees")
      .update({ password: hashed })
      .eq("id", employee.id);

    if (updateError) {
      console.error(
        `FAIL  ${employee.employee_id}: ${updateError.message}`
      );
      failed += 1;
      continue;
    }

    console.log(`OK    ${employee.employee_id}`);
    migrated += 1;
  }

  console.log("");
  console.log(
    `Done. migrated=${migrated} skipped=${skipped} failed=${failed}`
  );

  if (failed > 0) {
    process.exit(1);
  }
};

migratePasswords().catch((err) => {
  console.error(err);
  process.exit(1);
});
