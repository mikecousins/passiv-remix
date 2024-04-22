import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import axios from 'axios';
import { Strong, Text } from '~/components/text';
import { getSession } from '~/services/session.server';

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

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { id } = params;
  const session = await getSession(request.headers.get('Cookie'));
  const token = session.get('jwt_token');
  const groups = await axios.get<PortfolioGroup[]>(
    'https://api.passiv.com/api/v1/portfolioGroups',
    {
      headers: {
        Authorization: `JWT ${token}`,
      },
    },
  );
  const group = groups.data.find((group) => group.id === id);

  const response = await axios.get<PortfolioGroupInfo>(
    `https://api.passiv.com/api/v1/portfolioGroups/${id}/info/`,
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

  return json({
    ...response.data,
    ...group,
    cash,
    equity,
  });
};

export default function Index() {
  const { name, cash, equity } = useLoaderData<typeof loader>();
  return (
    <div className="container mx-auto max-w-7xl">
      <h1 className="text-white font-bold text-xl">{name}</h1>
      <Text>
        <Strong>Total Equity:</Strong> {equity}
      </Text>
      <Text>
        <Strong>Total Cash:</Strong> {cash}
      </Text>
    </div>
  );
}
