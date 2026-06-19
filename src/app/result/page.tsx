import { ResultContent } from "@/components/quiz/ResultContent";

type ResultPageProps = {
  searchParams: Promise<{
    unitId?: string;
    total?: string;
    correct?: string;
    wrong?: string;
  }>;
};

export default async function ResultPage({ searchParams }: ResultPageProps) {
  const params = await searchParams;

  return (
    <ResultContent
      unitId={params.unitId ?? "industry"}
      total={params.total ?? "0"}
      correct={params.correct ?? "0"}
      wrong={params.wrong ?? ""}
    />
  );
}
