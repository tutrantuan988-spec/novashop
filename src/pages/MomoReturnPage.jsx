import { memo, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';

function MomoReturnPage() {
  const [params] = useSearchParams();
  const orderId = params.get('orderId');
  const resultCode = params.get('resultCode');

  useEffect(() => {
    document.title = 'Đang xử lý kết quả MoMo...';
  }, []);

  if (Number(resultCode) === 0) {
    return <Navigate to={`/thanh-toan/thanh-cong?orderId=${orderId}&method=momo`} replace />;
  }
  return <Navigate to={`/thanh-toan/that-bai?orderId=${orderId}&code=${resultCode}`} replace />;
}

export default memo(MomoReturnPage);
