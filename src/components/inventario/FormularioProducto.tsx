import { ThemedText } from "@/components/themed-text";
import type { AtributoProductoInput } from "@/database/productosService";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

interface FieldProps {
  label: string;
  required?: boolean;
  theme: any;
}

function Field({ label, required, theme, ...inputProps }: FieldProps & React.ComponentProps<typeof TextInput>) {
  const [focused, setFocused] = useState(false);
  const bloqueado = inputProps.editable === false;

  return (
    <View style={styles.fieldWrapper}>
      <ThemedText type="small" style={[styles.fieldLabel, { color: theme.textSecondary }]} numberOfLines={1}>
        {label}
        {required && <ThemedText style={{ color: theme.danger }}> *</ThemedText>}
      </ThemedText>
      <TextInput
        {...inputProps}
        onFocus={(e) => {
          setFocused(true);
          inputProps.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          inputProps.onBlur?.(e);
        }}
        style={[
          styles.input,
          {
            borderColor: focused && !bloqueado ? theme.primary : theme.border,
            backgroundColor: bloqueado ? theme.border + "44" : theme.input,
            color: bloqueado ? theme.textSecondary : theme.text,
          },
          inputProps.style,
        ]}
        placeholderTextColor={theme.textSecondary}
      />
    </View>
  );
}

export interface FormularioProductoProps {
  nombre: string;
  setNombre: (v: string) => void;
  marca: string;
  setMarca: (v: string) => void;
  atributos: AtributoProductoInput[];
  setAtributos: (v: AtributoProductoInput[]) => void;
  stock: string;
  setStock: (v: string) => void;
  precioCompra: string;
  setPrecioCompra: (v: string) => void;
  precioVenta: string;
  setPrecioVenta: (v: string) => void;
  esEdicion: boolean;
  esIngreso?: boolean;
}

export function FormularioProducto(props: FormularioProductoProps) {
  const theme = useTheme();
  const stockLabel = props.esIngreso ? "Cantidad a ingresar" : props.esEdicion ? "Stock 🔒" : "Stock inicial";

  const stockEditable = props.esIngreso || !props.esEdicion;
  const stockRequired = props.esIngreso || !props.esEdicion;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.flexNombre}>
          <Field
            label="Nombre o modelo"
            required
            theme={theme}
            placeholder="Ej. Nike Air Force 1"
            value={props.nombre}
            onChangeText={props.setNombre}
            editable={!props.esIngreso}
          />
        </View>
        <View style={styles.flexMarca}>
          <Field label="Marca" theme={theme} placeholder="Ej. Nike" value={props.marca} onChangeText={props.setMarca} editable={!props.esIngreso} />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.flex1}>
          <Field
            label={stockLabel}
            required={stockRequired}
            theme={theme}
            placeholder={props.esIngreso ? "Ej. 5" : "10"}
            keyboardType="numeric"
            value={props.stock}
            onChangeText={props.setStock}
            editable={stockEditable}
          />
        </View>
      </View>

      <View style={styles.attributesHeader}>
        <ThemedText type="smallBold">Atributos</ThemedText>
        {!props.esIngreso && (
          <TouchableOpacity
            onPress={() => props.setAtributos([...props.atributos, { clave: "", valor: "" }])}
            accessibilityRole="button"
            accessibilityLabel="Agregar atributo"
          >
            <ThemedText type="smallBold" style={{ color: theme.primary }}>
              + Agregar
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>

      {props.atributos.map((atributo, index) => (
        <View style={styles.attributeRow} key={index}>
          <View style={styles.attributeField}>
            <Field
              label={index === 0 ? "Clave" : ""}
              theme={theme}
              placeholder=""
              value={atributo.clave}
              onChangeText={(clave) => {
                const next = [...props.atributos];
                next[index] = { ...next[index], clave };
                props.setAtributos(next);
              }}
              editable={!props.esIngreso}
            />
          </View>
          <View style={styles.attributeField}>
            <Field
              label={index === 0 ? "Valor" : ""}
              theme={theme}
              placeholder=""
              value={atributo.valor}
              onChangeText={(valor) => {
                const next = [...props.atributos];
                next[index] = { ...next[index], valor };
                props.setAtributos(next);
              }}
              editable={!props.esIngreso}
            />
          </View>
          {!props.esIngreso && (
            <TouchableOpacity
              style={styles.removeAttribute}
              onPress={() => props.setAtributos(props.atributos.filter((_, itemIndex) => itemIndex !== index))}
              accessibilityRole="button"
              accessibilityLabel={`Eliminar atributo ${atributo.clave || index + 1}`}
            >
              <Ionicons name="trash-outline" size={18} color={theme.danger} />
            </TouchableOpacity>
          )}
        </View>
      ))}

      <View style={styles.row}>
        <View style={styles.flex1}>
          <Field
            label="Compra (S/)"
            theme={theme}
            placeholder="0.00"
            keyboardType="numeric"
            value={props.precioCompra}
            onChangeText={props.setPrecioCompra}
            editable={!props.esIngreso}
          />
        </View>
        <View style={styles.flex1}>
          <Field
            label="Venta (S/)"
            required
            theme={theme}
            placeholder="0.00"
            keyboardType="numeric"
            value={props.precioVenta}
            onChangeText={props.setPrecioVenta}
            editable={!props.esIngreso}
          />
        </View>
      </View>

      {/* Mensaje informativo: solo cuando es EDICIÓN pura (no ingreso) */}
      {props.esEdicion && !props.esIngreso && (
        <View
          style={[
            styles.infoRow,
            {
              backgroundColor: theme.primary + "15",
              borderColor: theme.primary + "33",
            },
          ]}
        >
          <Ionicons name="information-circle-outline" size={13} color={theme.primary} />
          <ThemedText
            type="small"
            style={{
              color: theme.primary,
              fontSize: 10,
              marginLeft: 5,
              flex: 1,
            }}
          >
            El stock se gestiona desde movimientos.
          </ThemedText>
        </View>
      )}

      {/* Mensaje informativo: cuando es INGRESO */}
      {props.esIngreso && (
        <View
          style={[
            styles.infoRow,
            {
              backgroundColor: theme.success + "15",
              borderColor: theme.success + "33",
            },
          ]}
        >
          <Ionicons name="add-circle-outline" size={13} color={theme.success} />
          <ThemedText
            type="small"
            style={{
              color: theme.success,
              fontSize: 10,
              marginLeft: 5,
              flex: 1,
            }}
          >
            Se sumará al stock actual del producto.
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  row: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
    marginBottom: 8,
  },
  flex1: { flex: 1 },
  flexNombre: { flex: 1.6 },
  flexMarca: { flex: 1 },
  attributesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 6,
  },
  attributeRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 8,
  },
  attributeField: {
    flex: 1,
    minWidth: 0,
  },
  removeAttribute: {
    width: 36,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  fieldWrapper: {
    width: "100%",
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 3,
    marginLeft: 2,
    letterSpacing: 0.3,
  },
  input: {
    height: 40,
    width: "100%",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    fontSize: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 2,
    width: "100%",
  },
});
