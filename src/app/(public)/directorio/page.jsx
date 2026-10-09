import DirectoryExplorer from "@/features/public/directory/components/DirectoryExplorer";

export const metadata = { title: "Directorio | Biblioteca" };

export default async function DirectoryPage({ searchParams }) {
  const params = await searchParams;
  return <DirectoryExplorer initialQuery={params?.q ?? ""} initialType={params?.tipo ?? "database"} />;
}