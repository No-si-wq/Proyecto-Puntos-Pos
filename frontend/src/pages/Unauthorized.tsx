import { Result, Button } from "antd";
import { useNavigate } from "react-router-dom";

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <Result
      status="403"
      title="403"
      subTitle="No tienes permisos para acceder a esta página."
      extra={
        <Button type="primary" onClick={() => navigate("/")}>
          Volver al inicio
        </Button>
      }
    />
  );
}