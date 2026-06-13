import { useState, useRef, useEffect } from "react";

import { 
  Card, 
  Select, 
  InputNumber,
  message,
  Row, 
  Col,
  Button,
  DatePicker,
  Tag,
  Divider,
  Modal,
  Drawer,
  Input,
  type InputRef,
} from "antd";
import { PrinterOutlined, ShoppingCartOutlined } from "@ant-design/icons";

import { useCustomers } from "../../customers/useCustomers";
import { useSales } from "../hooks/useSales";
import { useUsers } from "../../users/useUsers";
import { useBarcodeScanner } from "../../../core/hooks/useBarcodeScanner";
import { saleStore } from "../types/sale.store";
import { SaleCartTable } from "../components/SaleCartTable";
import { formatCurrency } from "../../../core/utils/formatters";
import { useDeviceType } from "../../../core/hooks/useDeviceType";
import { useResponsiveSizes } from "../../../core/hooks/useResponsiveSizes";
import { useRequiredWarehouse } from "../../warehouses/hooks/useRequiredWarehouse";
import { useWarehouseProducts } from "../../warehouses/hooks/useWarehouseProducts";
import { usePriceLists } from "../../priceLists/hooks/usePriceList";
import type { SalePaymentMethod } from "../types/sale";
import type { Sale } from "../types/sale";
import { saleCartStore } from "../types/saleCart.store";
import { Role } from "../../../core/auth/roles";
import { useReportTemplates } from "../../report-templates/hooks/useReportTemplates";
import { buildSaleHtml, resolveWindowSize } from "../../report-templates/utils/resolveTemplate";
import { useSettings } from "../../settings/hooks/useSettings";
import http from "../../../core/http/http";

import PageHeader from "../../../core/components/common/PageHeader";

export default function Sales() {
  const { customers, reload: reloadCustomers } = useCustomers();
  const { priceMode, loyaltyConfig } = useSettings();
  const { users = [] } = useUsers();
  const sellers = users.filter((u) => u.role === Role.SELLER);
  const [sellerId, setSellerId] = useState<number | undefined>();
  const warehouseId = useRequiredWarehouse();
  const { products, reload: reloadProducts } = useWarehouseProducts();
  const { priceLists = [] } = usePriceLists();

  const [payments, setPayments] = useState<
    { method: SalePaymentMethod; amount: number | null; reference?: string }[]
  >([{ method: "CASH", amount: null }]);
  const [dueDate, setDueDate] = useState<string>();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const { isMobile, isTablet, device } = useDeviceType();
  const tableSpan   = device === "desktop" ? 16 : device === "tablet" ? 14 : 24;
  const summarySpan = device === "desktop" ? 8  : device === "tablet" ? 10 : 24;
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [observations, setObservations] = useState<string>("");
  const inputRef = useRef<InputRef>(null);
  const sizes = useResponsiveSizes();

  const { create, creating } = useSales();
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const selectRef = useRef<any>(null);
  const cart = saleCartStore();

  const { getDefault, getById, templates = [] } = useReportTemplates();
  const [printModalOpen,   setPrintModalOpen]   = useState(false);
  const [pendingPrintSale, setPendingPrintSale] = useState<Sale | null>(null);
  const [printing,         setPrinting]         = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);

  async function openPrintForSale(sale: Sale) {
    setPendingPrintSale(sale);
    setPrintModalOpen(true);
  }

  async function handleConfirmPrint() {
    if (!pendingPrintSale) return;
    setPrinting(true);
    try {
      const { data: fullSale } = await http.get<Sale>(`/sales/${pendingPrintSale.id}`);
      let defaultT = selectedTemplate
        ? await getById(selectedTemplate).catch(() => null)
        : await getDefault();

      if (!defaultT) {
        message.warning("No hay plantilla por defecto configurada");
        setPrintModalOpen(false);
        return;
      }

      const html = buildSaleHtml(fullSale, defaultT.config);
      const { width, height } = resolveWindowSize(defaultT.config);

      const win = window.open(
        "",
        "_blank",
        `width=${width},height=${height},menubar=no,toolbar=no,location=no,status=no`
      );
      if (!win) {
        message.error("No se pudo abrir la ventana. Verifica que no esté bloqueada.");
        return;
      }

      win.document.write(html);
      win.document.close();
      win.onload = () => {
        win.focus();
        win.print();
        win.onafterprint = () => win.close();
      };

    } catch (err) {
      console.error("error al seleccionar plantilla:", err);
      message.error("Error al cargar la plantilla de impresión");
    } finally {
      setPrinting(false);
      setPrintModalOpen(false);
      setPendingPrintSale(null);
      setSelectedTemplate(null);
    }
  }

  useEffect(() => {
    cart.clear();
  }, [warehouseId]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    cart.setPriceMode(priceMode);
  }, [priceMode]);

  useBarcodeScanner({
    onProductFound: (product) => {
      const item = cart.items.find((i) => i.productId === product.id);
      if (item) {
        cart.updateQuantity(product.id, item.quantity + 1);
        return;
      }
      cart.addProduct(product, undefined);
    },
  });

  const sale = saleStore();
  const selectedCustomer = customers.find((c) => c.id === sale.customerId);
  const availablePoints = selectedCustomer?.points?.balance ?? 0;

  const estimatedCommission = cart.totalCommission();

  const pointValue = loyaltyConfig.redeem.pointValue;
  const pointsDiscount = sale.pointsUsed * pointValue;
  const totalFinal = cart.total() - pointsDiscount;

  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
  const EPS = 0.005;

  const hasCredit = payments.some((p) => p.method === "CREDIT");
  const creditPayment = payments.find((p) => p.method === "CREDIT");
  const creditAmount = creditPayment?.amount ?? 0;
  const nonCreditPayments = payments.filter((p) => p.method !== "CREDIT");
  const totalNonCredit = nonCreditPayments.reduce((s, p) => s + (p.amount ?? 0), 0);
  const totalAssigned = round2(totalNonCredit + creditAmount);
  const totalFinalRounded = round2(totalFinal);
  const remaining = round2(totalFinalRounded - totalAssigned);

  const isSubmitDisabled = cart.items.length === 0

  async function submitSale() {
    if (cart.items.length === 0) {
      message.warning("El carrito está vacío");
      return;
    }

    if (sale.pointsUsed > availablePoints) {
      message.error("Puntos insuficientes");
      return;
    }

    if (hasCredit) {
      if (!sale.customerId) {
        message.error("Debe seleccionar cliente para crédito");
        return;
      }
      if (!dueDate) {
        message.error("Debe seleccionar fecha de vencimiento");
        return;
      }
      if (creditAmount <= 0) {
        message.error("Ingrese el monto a crédito");
        return;
      }
    }

    const finalTotal = cart.total() - pointsDiscount;
    if (finalTotal < 0) {
      message.error("Total inválido");
      return;
    }

    const pointsToUse = loyaltyConfig.redeem.enabled ? sale.pointsUsed : 0;

    if (nonCreditPayments.some((p) => p.amount === null || p.amount <= 0)) {
      message.error("Ingrese un monto válido para cada método de pago");
      return;
    }

    if (hasCredit && Math.abs(totalAssigned - totalFinalRounded) > EPS) {
      message.error("La suma de los métodos de pago debe ser igual al total de la venta");
      return;
    }

    if (!hasCredit && totalAssigned < totalFinalRounded - EPS) {
      message.error("El monto pagado es insuficiente");
      return;
    }

    try {
      const result = await create({
        customerId: sale.customerId,
        pointsUsed: pointsToUse,
        sellerId,
        observations,
        items: cart.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          discountType: i.discountType,
          discountValue: i.discountValue,
          priceListId: i.priceListId,
          observations: i.observations || undefined,
          unitPrice: i.priceOverridden ? i.price : undefined,
        })),
        payments: [
          ...nonCreditPayments
            .filter((p) => p.amount !== null && p.amount > 0)
            .map((p) => ({
              method: p.method,
              amount: p.amount!,
              reference: p.reference || undefined,
            })),
          ...(hasCredit ? [{ method: "CREDIT" as const, amount: creditAmount }] : []),
        ],
        dueDate,
        priceMode,
      });

      await Promise.all([reloadProducts(), reloadCustomers()]);

      cart.clear();
      sale.reset();
      setPayments([{ method: "CASH", amount: null }]);
      setSellerId(undefined);
      setDueDate(undefined);
      setPaymentModalOpen(false);
      setObservations("");

      message.success(
        result?.pointsEarned
          ? `Venta realizada. Puntos ganados: ${result.pointsEarned}`
          : "Venta realizada"
      );

      if (result) openPrintForSale(result as Sale);
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? "Error creando venta");
    }
  }

  const summaryPanel = (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

    <Row gutter={8}>
      <Col span={12}>
        <div style={{ fontSize: 11, color: "#888", marginBottom: 3 }}>VENDEDOR</div>
        <Select
          showSearch
          allowClear
          listHeight={sizes.selectListHeight}
          size={sizes.select}
          placeholder="Vendedor"
          value={sellerId}
          onChange={(v) => setSellerId(v ?? undefined)}
          style={{ width: "100%" }}
          filterOption={(input, option) =>
            (option?.label as string).toLowerCase().includes(input.toLowerCase())
          }
          options={sellers
            .filter((u) => u.active)
            .map((u) => ({ value: u.id, label: `${u.name}` }))}
        />
      </Col>
      <Col span={12}>
        <div style={{ fontSize: 11, color: "#888", marginBottom: 3 }}>CLIENTE</div>
        <Select
          showSearch
          allowClear
          listHeight={sizes.selectListHeight}
          size={sizes.select}
          placeholder="Cliente"
          value={sale.customerId}
          onChange={(v) => sale.setCustomer(v ?? undefined)}
          style={{ width: "100%" }}
          filterOption={(input, option) =>
            (option?.label as string).toLowerCase().includes(input.toLowerCase())
          }
          options={customers
            .filter((c) => c.active)
            .map((c) => ({ value: c.id, label: `${c.dni} - ${c.name}` }))}
        />
      </Col>
    </Row>

    <div>
      <div style={{ fontSize: 11, color: "#888", marginBottom: 3 }}>OBSERVACIONES</div>
      <Input.TextArea
        rows={1}
        maxLength={500}
        size={sizes.input}
        placeholder="Notas internas, instrucciones de entrega..."
        value={observations}
        onChange={(e) => setObservations(e.target.value)}
        style={{ resize: "none" }}
      />
    </div>

      {selectedCustomer && loyaltyConfig.redeem.enabled && (
        <div style={{ padding: "8px 10px", background: "#f6ffed", borderRadius: 6, border: "1px solid #b7eb8f" }}>
          <Row align="middle" gutter={8}>
            <Col flex={1}>
              <span style={{ fontSize: 12, color: "#52c41a" }}>
                Puntos disponibles: <strong>{availablePoints}</strong>
              </span>
            </Col>
            <Col>
              <InputNumber
                size="small"
                min={0}
                max={availablePoints}
                value={sale.pointsUsed}
                onChange={(v) => sale.setPoints(Math.min(Number(v) || 0, availablePoints))}
                placeholder="Usar puntos"
                style={{ width: 110 }}
              />
            </Col>
          </Row>
        </div>
      )}

      <Divider style={{ margin: "0" }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {/* Base sin impuesto — solo en TAX_INCLUDED */}
        {cart.priceMode === "TAX_INCLUDED" && cart.totalTax() > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#666" }}>Base gravable</span>
            <strong>{formatCurrency(cart.subtotal())}</strong>
          </div>
        )}

        {cart.totalTax() > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#666" }}>ISV</span>
            <strong style={{ color: "#faad14" }}>{formatCurrency(cart.totalTax())}</strong>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#666" }}>Subtotal bruto</span>
          <strong>{formatCurrency(cart.grossSubtotal())}</strong>
        </div>

        {cart.totalDiscount() > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#666" }}>Descuento productos</span>
            <strong style={{ color: "#ff4d4f" }}>−{formatCurrency(cart.totalDiscount())}</strong>
          </div>
        )}

        {sale.pointsUsed > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#666" }}>Descuento puntos</span>
            <strong style={{ color: "#ff4d4f" }}>−{formatCurrency(sale.pointsUsed * pointValue)}</strong>
          </div>
        )}

        {estimatedCommission > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#52c41a" }}>Comisión estimada</span>
            <strong style={{ color: "#52c41a" }}>{formatCurrency(estimatedCommission)}</strong>
          </div>
        )}
      </div>

      <Divider style={{ margin: "0" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ color: "#888", fontSize: 13 }}>Total</span>
        <span style={{ fontSize: sizes.totalFontSize + 6, fontWeight: 700 }}>
          {formatCurrency(totalFinal)}
        </span>
      </div>

      <Button
        type="primary"
        size={sizes.button}
        block
        disabled={isSubmitDisabled}
        onClick={() => totalFinal === 0 ? submitSale() : setPaymentModalOpen(true)}
      >
        Confirmar venta
      </Button>
    </div>
  );
  
  const modals = (
    <>
      <Modal
        title="Método de pago"
        open={paymentModalOpen}
        onCancel={() => setPaymentModalOpen(false)}
        onOk={submitSale}
        okText="Confirmar venta"
        cancelText="Cancelar"
        confirmLoading={creating}
        okButtonProps={{
          disabled:
            (hasCredit && (!dueDate || creditAmount <= 0 || Math.abs(totalAssigned - totalFinalRounded) > EPS)) ||
            (!hasCredit && totalAssigned < totalFinalRounded - EPS),
        }}
        width={420}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 8 }}>
          {payments.map((p, idx) => (
            <div key={idx}>
              <Row gutter={8} align="middle">
                <Col span={14}>
                  <Select
                    value={p.method}
                    style={{ width: "100%" }}
                    onChange={(value: SalePaymentMethod) => {
                      setPayments((prev) => {
                        const updated = [...prev];
                        updated[idx] = {
                          ...updated[idx],
                          method: value,
                          amount: value === "CREDIT"
                            ? Math.max(totalFinal - totalNonCredit, 0)
                            : updated[idx].amount,
                        };
                        return updated;
                      });
                      if (value !== "CREDIT") setDueDate(undefined);
                    }}
                    options={[
                      { label: "Efectivo",      value: "CASH"     },
                      { label: "Tarjeta",       value: "CARD"     },
                      { label: "Transferencia", value: "TRANSFER" },
                      ...(!hasCredit || p.method === "CREDIT"
                        ? [{ label: "Crédito", value: "CREDIT" }]
                        : []),
                    ]}
                  />
                </Col>

                <Col span={6}>
                  <InputNumber
                    style={{ width: "100%" }}
                    min={0}
                    precision={2}
                    value={p.amount}
                    placeholder="Monto"
                    onChange={(v) => {
                      setPayments((prev) => {
                        const updated = [...prev];
                        updated[idx] = { ...updated[idx], amount: v ?? null };
                        return updated;
                      });
                    }}
                  />
                </Col>
                <Col span={4}>
                  {payments.length > 1 && (
                    <Button
                      danger
                      size="small"
                      onClick={() => {
                        setPayments((prev) => prev.filter((_, i) => i !== idx));
                        if (p.method === "CREDIT") setDueDate(undefined);
                      }}
                    >
                      Quitar
                    </Button>
                  )}
                </Col>
              </Row>

              {p.method === "CREDIT" && (
                <>
                  <DatePicker
                    style={{ width: "100%", marginTop: 8 }}
                    placeholder="Vencimiento"
                    onChange={(date) => setDueDate(date?.toISOString())}
                  />
                  <Tag color="orange" style={{ marginTop: 8 }}>Venta a crédito</Tag>
                </>
              )}
            </div>
          ))}

          <Button
            size="small"
            type="dashed"
            onClick={() => setPayments((prev) => [...prev, { method: "CASH", amount: null }])}
          >
            + Agregar método de pago
          </Button>

          <Divider style={{ margin: "4px 0" }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ color: "#888" }}>Total a cobrar</span>
            <strong style={{ fontSize: 20 }}>{formatCurrency(totalFinal)}</strong>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#666" }}>Asignado</span>
            <strong>{formatCurrency(totalAssigned)}</strong>
          </div>

          {remaining > 0 && (
            <span style={{ color: "#ff4d4f", fontSize: 12 }}>
              Falta {formatCurrency(remaining)}
            </span>
          )}

          {remaining < 0 && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#666" }}>Cambio</span>
              <strong style={{ color: "#52c41a" }}>{formatCurrency(-remaining)}</strong>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={printModalOpen}
        title={<span><PrinterOutlined style={{ marginRight: 8 }} />Imprimir factura</span>}
        onOk={handleConfirmPrint}
        onCancel={() => {
          setPrintModalOpen(false);
          setPendingPrintSale(null);
          setSelectedTemplate(null);
        }}
        okText="Imprimir"
        cancelText="Omitir"
        confirmLoading={printing}
        width={360}
      >
        <p style={{ marginBottom: 8 }}>
          Venta <strong>{pendingPrintSale?.saleNumber}</strong> creada correctamente.
        </p>
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>FORMATO DE FACTURA</div>
          <Select
            style={{ width: "100%" }}
            placeholder="Plantilla por defecto"
            allowClear
            value={selectedTemplate}
            onChange={(v) => setSelectedTemplate(v ?? null)}
            options={templates.map((t) => ({ value: t.id, label: t.name }))}
          />
        </div>
        <p style={{ color: "#888", fontSize: 13 }}>
          {selectedTemplate
            ? "Se usará la plantilla seleccionada."
            : "Se usará la plantilla por defecto."}
        </p>
      </Modal>
    </>
  )

  if (isMobile) {
    return (
      <>
        <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "#fff" }}>
          <PageHeader title="Ventas" subtitle="Punto de venta" />

          <div style={{ padding: 16, borderBottom: "1px solid #f0f0f0", background: "#fff" }}>
            <Select
              ref={selectRef}
              showSearch
              allowClear
              disabled={!warehouseId}
              placeholder="Buscar producto"
              size={sizes.select}
              style={{ width: "100%" }}
              value={selectedProductId}
              onChange={setSelectedProductId}
              onSelect={(id: number) => {
                const product = products.find((p) => p.id === id);
                if (product) cart.addProduct(product, undefined);
                setSelectedProductId(null);
                selectRef.current?.blur();
              }}
              filterOption={(input, option) => {
                const label = option?.label as string;
                return label?.toLowerCase().includes(input.toLowerCase());
              }}
              options={products
                .filter((p) => p.active)
                .map((p) => ({
                  value: p.id,
                  label: `${p.barcodes[0]?.code ?? ""} - ${p.name} - ${p.stock}`,
                  disabled: p.stock <= 0,
                }))}
            />
          </div>

          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 16, background: "#fafafa" }}>
            <SaleCartTable
              items={cart.items}
              onQuantityChange={cart.updateQuantity}
              onRemove={cart.removeProduct}
              onDiscountChange={cart.updateDiscount}
              onObservationsChange={cart.updateObservations}
              onPriceChange={(productId, price) => cart.updatePrice(productId, price)}
              onPriceListChange={(productId, priceListId, resolvedPrice) => {
                cart.updatePriceList(productId, priceListId, resolvedPrice);
                cart.updatePrice(productId, resolvedPrice);
              }}
              priceLists={priceLists}
              products={products}
            />
          </div>

          <div
            style={{
              position: "sticky",
              bottom: 0,
              zIndex: 10,
              background: "#fff",
              borderTop: "1px solid #f0f0f0",
              padding: "10px 16px calc(10px + env(safe-area-inset-bottom))",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              boxShadow: "0 -4px 12px rgba(0,0,0,0.05)",
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: "#888" }}>Total</div>
              <strong style={{ fontSize: 18 }}>
                {formatCurrency(totalFinal)}
              </strong>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button
                icon={<ShoppingCartOutlined />}
                onClick={() => setSummaryOpen(true)}
                disabled={cart.items.length === 0}
              >
                Resumen
              </Button>
              <Button
                type="primary"
                loading={creating}
                disabled={isSubmitDisabled}
                onClick={() => totalFinal === 0 ? submitSale() : setPaymentModalOpen(true)}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>

        <Drawer
          title="Resumen de la venta"
          placement="bottom"
          height="auto"
          open={summaryOpen}
          onClose={() => setSummaryOpen(false)}
          styles={{ body: { paddingBottom: 32 } }}
        >
          {summaryPanel}
        </Drawer>
        {modals}
      </>
    );
  }

  return (
    <>
      <PageHeader title="Ventas" subtitle="Punto de venta" />

      <Row gutter={sizes.gutter} align="top">
        <Col span={tableSpan}>
          <Card title="Productos" bodyStyle={{ padding: sizes.cardPadding }}>
            <div style={{ marginBottom: 20 }}>
              <Select
                ref={selectRef}
                showSearch
                allowClear
                autoClearSearchValue
                disabled={!warehouseId}
                placeholder="Buscar producto"
                size={sizes.select}
                listHeight={sizes.selectListHeight}
                style={{ width: "100%", marginBottom: isTablet ? 20 : 16 }}
                optionFilterProp="label"
                defaultActiveFirstOption
                value={selectedProductId}
                onChange={setSelectedProductId}
                onSelect={(id: number) => {
                  const product = products.find((p) => p.id === id);
                  if (product) cart.addProduct(product, undefined);
                  setSelectedProductId(null);
                  selectRef.current?.blur();
                  setTimeout(() => selectRef.current?.focus(), 0);
                }}
                filterOption={(input, option) => {
                  const label = option?.label as string;
                  return label?.toLowerCase().includes(input.toLowerCase());
                }}
                options={products
                  .filter((p) => p.active)
                  .map((p) => ({
                    value: p.id,
                    label: `${p.sku} ${p.barcodes[0]?.code ?? ""} - ${p.name} - ${p.stock}`,
                    disabled: p.stock <= 0,
                  }))}
              />
            </div>

            <SaleCartTable
              items={cart.items}
              onQuantityChange={cart.updateQuantity}
              onRemove={cart.removeProduct}
              onDiscountChange={cart.updateDiscount}
              onObservationsChange={cart.updateObservations}
              onPriceListChange={(productId, priceListId, resolvedPrice) => {
                cart.updatePriceList(productId, priceListId, resolvedPrice);
                cart.updatePrice(productId, resolvedPrice);
              }}
              onPriceChange={(productId, price) => cart.updatePrice(productId, price)}
              priceLists={priceLists}
              products={products}
            />
          </Card>
        </Col>
          {!isMobile && (
            <Col span={summarySpan}>
              <div style={{ position: "sticky", top: 0, display: "flex", flexDirection: "column", gap: sizes.gap }}>
                <Card
                  size="small"
                  bodyStyle={{ padding: sizes.cardPadding }}
                  style={{ borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
                >
                  {summaryPanel}
                </Card>
              </div>
            </Col>
          )}
      </Row>
      {modals}
    </>
  );
}
