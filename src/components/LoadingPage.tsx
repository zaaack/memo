import { Loading } from 'antd-mobile';
import React from 'react';

function LoadingPage() {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Loading />
    </div>
  );
}

export default LoadingPage;
