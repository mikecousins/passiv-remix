import { json, redirect, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, type ClientLoaderFunctionArgs } from '@remix-run/react';
import axios from 'axios';
import { cacheClientLoader } from 'remix-client-cache';
import Group from '~/components/Group';
import { Strong } from '~/components/text';
import { getSession } from '~/services/session.server';
import { formatCurrency } from '~/utilities/numbers';

type PortfolioGroup = {
  id: string;
  name: string;
};

type Balance = {
  cash: number;
};

type Position = {
  fractional_units: number;
  price: number;
};

type PortfolioGroupInfo = {
  accuracy: number;
  balances: Balance[];
  calculated_trades: {
    id: string;
    trades: unknown[];
  };
  positions: Position[];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const session = await getSession(request.headers.get('Cookie'));
  const token = session.get('jwt_token');
  if (!token) {
    return redirect('/logout');
  }
  const groups = await axios.get<PortfolioGroup[]>(
    'https://api.passiv.com/api/v1/portfolioGroups',
    {
      headers: {
        Authorization: `JWT ${token}`,
      },
    },
  );
  const fullGroups = [];
  let totalEquity = 0;
  for (let i = 0; i < groups.data.length; i++) {
    const response = await axios.get<PortfolioGroupInfo>(
      `https://api.passiv.com/api/v1/portfolioGroups/${groups.data[i].id}/info/`,
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

export const clientLoader = (args: ClientLoaderFunctionArgs) =>
  cacheClientLoader(args);
clientLoader.hydrate = true;

export default function Index() {
  const { groups, totalEquity } = useLoaderData<typeof loader>();
  return (
    <div className="container mx-auto max-w-7xl p-4">
      <h1 className="text-white font-bold text-4xl mt-4">Passiv</h1>
      <div className="my-4 text-2xl text-zinc-400 flex">
        <div className="flex-1">Groups</div>
        <div>Total Equity: <Strong>{formatCurrency(totalEquity)}</Strong></div>
      </div>
      <div className="flex flex-col gap-4">
        {groups.map((group) => (
          <Group key={group.id} {...group} />
        ))}
      </div>
    </div>
  );
}
