import SetPasswordClient from './SetPasswordClient';

type SearchParams = Record<string, string | string[] | undefined>;

interface SetPasswordPageProps {
  searchParams?: SearchParams | Promise<SearchParams>;
}

async function resolveSearchParams(
  searchParams?: SearchParams | Promise<SearchParams>
): Promise<SearchParams> {
  if (!searchParams) {
    return {};
  }

  if (typeof (searchParams as Promise<SearchParams>).then === 'function') {
    return searchParams as Promise<SearchParams>;
  }

  return searchParams;
}

export default async function SetPasswordPage({ searchParams }: SetPasswordPageProps) {
  const resolved = await resolveSearchParams(searchParams);
  const tokenValue = resolved.token;
  const token = Array.isArray(tokenValue) ? tokenValue[0] : tokenValue || null;

  return <SetPasswordClient token={token} />;
}