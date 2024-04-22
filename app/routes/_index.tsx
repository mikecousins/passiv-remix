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
};

type Balance = {
  cash: number;
}

type Position = {
  fractional_units: number;
  price: number;
}

type PortfolioGroupInfo = {
  accuracy: number;
  balances: Balance[];
  calculated_trades: {
    id: string;
    trades: unknown[];
  }
  positions: Position[];
};

export const meta: MetaFunction = () => {
  return [
    { title: 'Passiv' },
  ];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const session = await getSession(request.headers.get('Cookie'));
  const token = session.get('jwt_token');
  const groups = await axios.get<PortfolioGroup[]>('portfolioGroups', {
    headers: {
      Authorization: `JWT ${token}`,
    },
  });
  const fullGroups = [];
  let totalEquity = 0;
  for (let i = 0; i < groups.data.length; i++) {
    const response = await axios.get<PortfolioGroupInfo>(
      `portfolioGroups/${groups.data[i].id}/info/`,
      {
        headers: {
          Authorization: `JWT ${token}`,
        },
      },
    );
    let cash = 0;
    response.data.balances.forEach((balance) => {
      cash += balance.cash;
    });
    let equity = 0;
    response.data.positions.forEach((position) => {
      equity += position.fractional_units * position.price;
    });
    fullGroups.push({ ...response.data, ...groups.data[i], cash, equity });
    totalEquity += cash + equity;
  }
  return json({
    groups: fullGroups,
    totalEquity,
  });
};

export default function Index() {
  const { groups, totalEquity } = useLoaderData<typeof loader>();
  console.log(groups[0].positions);
  return (
    <div className="container mx-auto max-w-7xl">
      <h1 className="text-red-500 font-bold">Passiv</h1>
      <div>Total Equity: {totalEquity}</div>
      {groups.map((group) => (
        <div key={group.id}>{group.name} {group.accuracy}% ${group.cash} ${group.equity}</div>
      ))}
    </div>
  );
}
