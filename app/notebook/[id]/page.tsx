// app/notebook/[id]/page.tsx
import Notebook from "./Notebook";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function NotebookPage(props: Props) {
  const params = await props.params;

  return <Notebook id={parseInt(params.id)} />;
}
