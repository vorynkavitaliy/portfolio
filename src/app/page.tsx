import { connection } from 'next/server';

export default async function HomePage() {
  await connection();

  return (
    <main>
      <h1>Vitalii Vorynka</h1>

      <p>Portfolio in progress.</p>
    </main>
  );
}
