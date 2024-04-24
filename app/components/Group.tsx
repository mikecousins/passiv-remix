import { formatCurrency } from '~/utilities/numbers';
import { Strong } from './text';

type Props = {
  accuracy: number;
  cash: number;
  equity: number;
  name: string;
};

const Group = ({ accuracy, cash, equity, name }: Props) => {
  return (
    <div className="flex bg-gradient-to-r from-zinc-900 to-cyan-900 text-xl">
      <div className="flex-1 p-4">{name}</div>
      <div className="p-4 text-zinc-500">
        Accuracy: <Strong>{Math.round(accuracy)}%</Strong>
      </div>
      <div className="p-4 text-zinc-500">
        Cash: <Strong>{formatCurrency(cash)}</Strong>
      </div>
      <div className="p-4 text-zinc-500">
        Total: <Strong>{formatCurrency(equity)}</Strong>
      </div>
    </div>
  );
};

export default Group;
