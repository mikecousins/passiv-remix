import { json, redirect, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, type ClientLoaderFunctionArgs } from '@remix-run/react';
import axios from 'axios';
import { cacheClientLoader } from 'remix-client-cache';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/table';
import { Strong, Text } from '~/components/text';
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
    <div className="container mx-auto max-w-7xl">
      <h1 className="text-white font-bold text-xl">Passiv</h1>
      <Text>
        <Strong>Total Equity:</Strong> {formatCurrency(totalEquity)}
      </Text>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>Name</TableHeader>
            <TableHeader>Accuracy</TableHeader>
            <TableHeader>Cash</TableHeader>
            <TableHeader>Equity</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {groups.map((group) => (
            <TableRow key={group.id} href={`/group/${group.id}`}>
              <TableCell>{group.name}</TableCell>
              <TableCell>{Math.round(group.accuracy)}%</TableCell>
              <TableCell>{formatCurrency(group.cash)}</TableCell>
              <TableCell>{formatCurrency(group.equity)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
