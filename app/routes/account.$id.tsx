import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, type ClientLoaderFunctionArgs } from '@remix-run/react';
import axios from 'axios';
import { cacheClientLoader } from 'remix-client-cache';
import { getSession } from '~/services/session.server';
import { formatCurrency } from '~/utilities/numbers';

type AccountHoldings = {
  account: {
    id: string;
    name: string;
    institution: string;
    balance: {
      total: {
        currency: string;
        amount: number;
      };
    };
  };
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { id } = params;
  const session = await getSession(request.headers.get('Cookie'));
  const token = session.get('jwt_token');

  const response = await axios.get<AccountHoldings>(
    `https://api.passiv.com/api/v1/accounts/${id}/holdings/`,
    {
      headers: {
        Authorization: `JWT ${token}`,
      },
    },
  );

  return json({
    ...response.data.account,
  });
};

export const clientLoader = (args: ClientLoaderFunctionArgs) =>
  cacheClientLoader(args);
clientLoader.hydrate = true;

export default function AccountPage() {
  const { name, balance } = useLoaderData<typeof loader>();
  return (
    <div className="container mx-auto max-w-7xl">
      <h1 className="text-white font-bold text-xl">{name}</h1>
      <div>Total Value: {formatCurrency(balance.total.amount)}</div>
    </div>
  );
}
