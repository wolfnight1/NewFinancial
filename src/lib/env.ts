export function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function getRequiredEnv(
  name: 'NEXT_PUBLIC_SUPABASE_URL' | 'NEXT_PUBLIC_SUPABASE_ANON_KEY'
) {
  let value: string | undefined;

  if (name === 'NEXT_PUBLIC_SUPABASE_URL') {
    value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  } else if (name === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
    value = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }

  if (!value) {
    console.warn(`Warning: Missing environment variable: ${name}. This might break Supabase integration.`);
    return '';
  }

  return value;
}
