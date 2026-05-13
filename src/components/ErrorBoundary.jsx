import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';
import { captureAppError } from '../lib/monitoring';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
    captureAppError(error, { componentStack: info?.componentStack });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <AlertTriangle size={56} aria-hidden />
          <h1>Đã có lỗi xảy ra</h1>
          <p>Xin lỗi, có sự cố không mong muốn. Bạn có thể thử lại hoặc về trang chủ.</p>
          <pre style={{fontSize:12,textAlign:'left',background:'#f8f3e8',padding:12,borderRadius:8,maxWidth:600,margin:'16px auto',overflow:'auto'}}>
            {this.state.error?.message}
            {'\n'}
            {this.state.error?.stack}
          </pre>
          <button type="button" className="primary-button" onClick={this.handleReset}>
            Về trang chủ
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
