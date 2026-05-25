import { Form, Input, Button, Card, message, Typography, Tabs } from "antd";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login, registerTenant } from "../../core/http/auth.api";
import { authStore, resolveDashboardRoute } from "./auth.store";
import { useDeviceType } from "../../core/hooks/useDeviceType";
import { useResponsiveSizes } from "../../core/hooks/useResponsiveSizes";

const { Title } = Typography;

export default function Login() {
  const navigate = useNavigate();

  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();

  const [activeTab, setActiveTab] = useState("login");
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loadingRegister, setLoadingRegister] = useState(false);
  const inviteFromUrl = new URLSearchParams(window.location.search).get("invite");

  const { isMobile, isTablet, isDesktop, isLandscape } = useDeviceType();
  const sizes = useResponsiveSizes();

  useEffect(() => {
    if (inviteFromUrl) {
      registerForm.setFieldsValue({ inviteCode: inviteFromUrl });
    }
  }, []);

  async function handleLogin(values: any) {
    try {
      setLoadingLogin(true);

      const slug = values.slug.trim().toLowerCase();
      const username = values.username.trim();

      const data = await login(slug, username, values.password);

      authStore.getState().login({
        user: data.user,
        warehouseId: data.warehouseId,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });

      message.success("Bienvenido");

      navigate(resolveDashboardRoute(data.user.role), { replace: true });

    } catch (err: any) {
      message.error(err.response?.data?.message ?? "Credenciales inválidas");
    } finally {
      setLoadingLogin(false);
    }
  }

  async function handleRegister(values: any) {
    try {
      setLoadingRegister(true);

      const data = await registerTenant({
        inviteCode: values.inviteCode.trim(),

        company: {
          name: values.companyName.trim(),
          slug: values.companySlug.trim().toLowerCase(),
        },

        admin: {
          username: values.adminUsername.trim(),
          password: values.adminPassword,
          confirmPassword: values.confirmPassword,
          name: values.adminName?.trim(),
        },
      });

      registerForm.resetFields();

      loginForm.setFieldsValue({
        slug: data.tenant.slug,
        username: data.user.username,
      });

      message.success(`Empresa registrada. Identificador: ${data.tenant.slug}`);

      setActiveTab("login");

    } catch (err: any) {
      const msg =
        err.response?.data?.message ??
        "Error al registrar la empresa";

      message.error(msg);

    } finally {
      setLoadingRegister(false);
    }
  }

  let maxWidth = 360;

  if (isTablet && isLandscape) maxWidth = 480;
  else if (isTablet) maxWidth = 420;
  else if (isDesktop) maxWidth = 400;

  const loginTab = (
    <Form
      form={loginForm}
      layout="vertical"
      onFinish={handleLogin}
      size={sizes.input}
    >
      <Form.Item
        name="slug"
        label="Identificador de empresa"
        rules={[{ required: true, message: "Ingrese el identificador" }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="username"
        label="Usuario"
        rules={[
          { required: true, message: "Ingrese usuario" },
          { min: 3, message: "Mínimo 3 caracteres" },
        ]}
      >
        <Input autoComplete="username" />
      </Form.Item>

      <Form.Item
        name="password"
        label="Contraseña"
        rules={[
          { required: true, message: "Ingrese contraseña" },
          { min: 6, message: "Mínimo 6 caracteres" },
        ]}
      >
        <Input.Password autoComplete="current-password" />
      </Form.Item>

      <Form.Item style={{ marginTop: sizes.gap }}>
        <Button
          type="primary"
          htmlType="submit"
          block
          loading={loadingLogin}
          size={sizes.button}
          style={{ height: sizes.minTouchHeight, fontWeight: 600 }}
        >
          Entrar
        </Button>
      </Form.Item>
    </Form>
  );

  const registerTab = (
    <Form
      form={registerForm}
      layout="vertical"
      onFinish={handleRegister}
      size={sizes.input}
    >

      <Form.Item
        name="inviteCode"
        label="Código de invitación"
        rules={[
          { required: true, message: "Ingrese el código de invitación" },
          {
            pattern: /^[a-f0-9]{32}$/,
            message: "Código inválido",
          },
        ]}
      >
        <Input
          placeholder="Ingrese su código de invitación"
          autoComplete="off"
        />
      </Form.Item>

      <Form.Item
        name="companyName"
        label="Nombre de la empresa"
        rules={[
          { required: true, message: "Ingrese el nombre de la empresa" },
          { min: 2, message: "Mínimo 2 caracteres" },
        ]}
      >
        <Input
          autoComplete="organization"
        />
      </Form.Item>

      <Form.Item
        name="companySlug"
        label="Identificador único"
        validateTrigger="onBlur"
        extra="Solo minúsculas, números y guiones"
        rules={[
          { required: true, message: "El identificador es requerido" },
          { min: 3, message: "Mínimo 3 caracteres" },
          { max: 40, message: "Máximo 40 caracteres" },
          {
            pattern: /^[a-z0-9]+(-[a-z0-9]*)*$/,
            message: "Solo letras minúsculas, números y guiones",
          },
        ]}
      >
        <Input
        />
      </Form.Item>

      <Form.Item name="adminName" label="Tu nombre (opcional)">
        <Input autoComplete="name" />
      </Form.Item>

      <Form.Item
        name="adminUsername"
        label="Usuario administrador"
        rules={[
          { required: true, message: "Ingrese usuario" },
          { min: 3, message: "Mínimo 3 caracteres" },
        ]}
      >
        <Input autoComplete="username" />
      </Form.Item>

      <Form.Item
        name="adminPassword"
        label="Contraseña"
        rules={[
          { required: true, message: "Ingrese contraseña" },
          {
            pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
            message:
              "Mínimo 8 caracteres, una mayúscula, una minúscula y un número",
          },
        ]}
      >
        <Input.Password autoComplete="new-password" />
      </Form.Item>

      <Form.Item
        name="confirmPassword"
        label="Confirmar contraseña"
        dependencies={["adminPassword"]}
        rules={[
          { required: true, message: "Confirme la contraseña" },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue("adminPassword") === value) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error("Las contraseñas no coinciden")
              );
            },
          }),
        ]}
      >
        <Input.Password autoComplete="new-password" />
      </Form.Item>

      <Form.Item style={{ marginTop: sizes.gap }}>
        <Button
          type="primary"
          htmlType="submit"
          block
          loading={loadingRegister}
          size={sizes.button}
          style={{ height: sizes.minTouchHeight, fontWeight: 600 }}
        >
          Crear empresa
        </Button>
      </Form.Item>
    </Form>
  );

  return (
    <Card
      bordered={!isMobile}
      style={{
        width: "100%",
        maxWidth,
        borderRadius: isMobile ? 0 : 8,
        boxShadow: isMobile ? "none" : "0 4px 12px rgba(0,0,0,0.05)",
      }}
      bodyStyle={{
        padding: isMobile ? 0 : sizes.cardPadding,
        overflowY: "visible",
      }}
    >
      <div style={{ padding: isMobile ? 24 : 0 }}>
        <Title
          level={isMobile ? 3 : 4}
          style={{ textAlign: "center", marginBottom: sizes.gap }}
        >
          Sistema POS
        </Title>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          centered
          items={[
            { key: "login", label: "Iniciar sesión", children: loginTab },
            { key: "register", label: "Registrar empresa", children: registerTab },
          ]}
        />
      </div>
    </Card>
  );
}