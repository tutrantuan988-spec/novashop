import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

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
          <button type="button" className="primary-button" onClick={this.handleReset}>
            Về trang chủ
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
