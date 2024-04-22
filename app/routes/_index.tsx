import {
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
} from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import axios from 'axios';
import { getSession } from '~/services/session.server';

type PortfolioGroup = {
  id: string;
  name: string;
}

export const meta: MetaFunction = () => {
  return [
    { title: 'Passiv' },
    { name: 'description', content: 'Welcome to Remix!' },
  ];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const session = await getSession(request.headers.get('Cookie'));
  const token = session.get('jwt_token');
  const groups = await axios.get<PortfolioGroup[]>(
    'portfolioGroups',
    {
      headers: {
        Authorization: `JWT ${token}`,
      },
    },
  );
  return json({
    groups: groups.data,
  });
};

export default function Index() {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="container mx-auto max-w-7xl">
      <h1 className="text-red-500 font-bold">Passiv</h1>
      {data.groups.map((group) => (
        <div key={group.id}>{group.name}</div>
      ))}
    </div>
  );
}
