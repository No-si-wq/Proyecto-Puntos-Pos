import {
  Form,
  Input,
  Button,
  Card,
  message,
  Typography,
} from "antd";
import { useNavigate } from "react-router-dom";
import { login } from "../../api/auth.api";
import { authStore, resolveDashboardRoute } from "../../store/auth.store";
import { useDeviceType } from "../../hooks/useDeviceType";
import { useResponsiveSizes } from "../../hooks/useResponsiveSizes";

const { Title } = Typography;

export default function Login() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;

  const { 
    isMobile, 
    isTablet,
    isDesktop,
    isLandscape,
  } = useDeviceType();
  const sizes = useResponsiveSizes();

  async function handleSubmit(values: {
    username: string;
    password: string;
  }) {
    try {
      const data = await login(
        values.username,
        values.password
      );

      authStore.getState().login({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });

      message.success("Bienvenido");
      navigate(resolveDashboardRoute(data.user.role), {
        replace: true,
      });
    } catch (err: any) {
      message.error(
        err.response?.data?.message ??
          "Credenciales inválidas"
      );
    }
  }

  let maxWidth = 360;

  if (isTablet && isLandscape) {
    maxWidth = 480;
  } else if (isTablet) {
    maxWidth = 420;
  } else if (isDesktop) {
    maxWidth = 400;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: isMobile
          ? "flex-start"
          : "center",
        justifyContent: "center",
        padding: 24,
        paddingTop: isStandalone ? 24 : 72,
        background: isStandalone ? "#fff" : "#fafafa",
      }}
    >
      <Card
        bordered={!isMobile}
        style={{
          width: "100%",
          maxWidth,
          borderRadius: isMobile ? 0 : 8,
          boxShadow: isMobile
            ? "none"
            : "0 4px 12px rgba(0,0,0,0.05)",
        }}
        bodyStyle={{
          padding: isMobile
            ? 0
            : sizes.cardPadding,
        }}
      >
        <div
          style={{
            padding: isMobile
              ? 24
              : 0,
          }}
        >
          <Title
            level={isMobile ? 3 : 4}
            style={{
              textAlign: "center",
              marginBottom: sizes.gap,
            }}
          >
            Iniciar Sesion
          </Title>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            size={sizes.input}
          >
            <Form.Item
              name="username"
              label="Usuario"
              rules={[
                {
                  required: true,
                  min: 3,
                  message:
                    "Ingrese usuario válido",
                },
              ]}
            >
              <Input
                autoFocus
                autoComplete="username"
                inputMode="text"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Contraseña"
              rules={[
                {
                  required: true,
                  min: 6,
                  message:
                    "Mínimo 6 caracteres",
                },
              ]}
            >
              <Input.Password
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item style={{ marginTop: sizes.gap }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                size={sizes.button}
                style={{
                  height: sizes.minTouchHeight,
                  fontWeight: 600,
                }}
              >
                Entrar
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Card>
    </div>
  );
}