import { useNavigate, useParams } from 'react-router-dom';
import KoreanStockCard from '../components/KoreanStockCard';
import StockCard from '../components/StockCard';

export default function StocksPage() {
  const { market = 'us' } = useParams();
  const navigate = useNavigate();
  if (market === 'kr') return <KoreanStockCard onOpenDetail={(item) => navigate(`/detail/korean-stock/${item.id}`, { state: { item } })} />;
  return <StockCard onOpenDetail={(item) => navigate(`/detail/stock/${item.id}`, { state: { item } })} />;
}
