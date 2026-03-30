import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const FILTERS = ['Todos', 'Vidro', 'Papel', 'Plástico', 'Garrafas', 'Retoma'];
const DISABLED_MAP_OPACITY = 0.72;

const INITIAL_POINTS = [
  {
    id: 1,
    name: 'Ecoponto Rua das Flores',
    types: ['Vidro', 'Papel', 'Plástico'],
    distance: 120,
    x: 0.52,
    y: 0.46,
    status: 'verified',
  },
  {
    id: 2,
    name: 'Retoma Mercado Bom Dia',
    types: ['Garrafas', 'Retoma'],
    distance: 280,
    x: 0.37,
    y: 0.35,
    status: 'verified',
  },
  {
    id: 3,
    name: 'Ecoponto Avenida Central',
    types: ['Vidro', 'Plástico'],
    distance: 430,
    x: 0.73,
    y: 0.38,
    status: 'verified',
  },
  {
    id: 4,
    name: 'Ecoponto Jardim Público',
    types: ['Papel'],
    distance: 620,
    x: 0.31,
    y: 0.64,
    status: 'verified',
  },
];

export default function App() {
  const [screen, setScreen] = useState('map');
  const [filter, setFilter] = useState('Todos');
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [searchAddress, setSearchAddress] = useState('');
  const [searchError, setSearchError] = useState('');
  const [points, setPoints] = useState(INITIAL_POINTS);
  const [selectedPointId, setSelectedPointId] = useState(INITIAL_POINTS[0].id);

  const [newLocation, setNewLocation] = useState({
    name: '',
    types: ['Vidro'],
    address: 'Rua das Flores, 10, Porto',
    x: 0.5,
    y: 0.5,
    photoLabel: '📷 Adicionar foto',
  });
  const [formErrors, setFormErrors] = useState({});
  const [duplicateCandidate, setDuplicateCandidate] = useState(null);
  const [duplicateDistanceMeters, setDuplicateDistanceMeters] = useState(null);
  const [miniMapSize, setMiniMapSize] = useState({ width: 1, height: 1 });

  const visiblePoints = useMemo(() => {
    if (filter === 'Todos') return points;
    return points.filter((point) => point.types.includes(filter));
  }, [filter, points]);

  const selectedPoint =
    visiblePoints.find((point) => point.id === selectedPointId) ||
    visiblePoints[0] ||
    null;

  const openAddLocation = () => {
    setFormErrors({});
    setDuplicateCandidate(null);
    setScreen('add');
  };

  const toggleType = (type) => {
    setNewLocation((current) => {
      const hasType = current.types.includes(type);
      if (hasType) {
        return { ...current, types: current.types.filter((item) => item !== type) };
      }
      return { ...current, types: [...current.types, type] };
    });
  };

  const updatePin = (x, y) => {
    const normalizedX = Math.max(0, Math.min(1, x));
    const normalizedY = Math.max(0, Math.min(1, y));

    setNewLocation((current) => ({
      ...current,
      x: normalizedX,
      y: normalizedY,
      address: `Ponto aproximado ${Math.round(normalizedY * 100)}, ${Math.round(
        normalizedX * 100
      )} - Porto`,
    }));
  };

  const findDuplicate = () => {
    return points.find((point) => {
      const dx = point.x - newLocation.x;
      const dy = point.y - newLocation.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < 0.12;
    });
  };

  const saveNewPoint = (possibleDuplicate) => {
    const newId = points.reduce((max, point) => Math.max(max, point.id), 0) + 1;
    const createdPoint = {
      id: newId,
      name: newLocation.name.trim(),
      types: newLocation.types,
      distance: 95,
      x: newLocation.x,
      y: newLocation.y,
      status: possibleDuplicate ? 'pending' : 'verified',
    };

    setPoints((current) => [...current, createdPoint]);
    setFilter('Todos');
    setSelectedPointId(createdPoint.id);
    setScreen('map');
    setDuplicateCandidate(null);
    setDuplicateDistanceMeters(null);
    setNewLocation({
      name: '',
      types: ['Vidro'],
      address: 'Rua das Flores, 10, Porto',
      x: 0.5,
      y: 0.5,
      photoLabel: '📷 Adicionar foto',
    });
  };

  const submitNewLocation = ({ forceDuplicate }) => {
    const nextErrors = {};
    if (!newLocation.name.trim()) nextErrors.name = 'Nome obrigatório';
    if (newLocation.types.length === 0) nextErrors.types = 'Tipo(s) obrigatório';

    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const duplicate = findDuplicate();
    if (duplicate && !forceDuplicate) {
      const dx = duplicate.x - newLocation.x;
      const dy = duplicate.y - newLocation.y;
      const normalizedDistance = Math.sqrt(dx * dx + dy * dy);
      const meters = Math.max(1, Math.round(normalizedDistance * 300));
      setDuplicateDistanceMeters(meters);
      setDuplicateCandidate(duplicate);
      return;
    }

    saveNewPoint(Boolean(duplicate));
  };

  const searchByAddress = () => {
    if (searchAddress.trim().length < 4) {
      setSearchError('Morada demasiado curta. Insere pelo menos 4 caracteres.');
      return;
    }
    setSearchError('');
    setLocationEnabled(true);
  };

  if (screen === 'add') {
    return (
      <View style={styles.app}>
        <StatusBar style="dark" />
        <View style={styles.topBar}>
          <Pressable onPress={() => setScreen('map')}>
            <Text style={styles.backText}>←</Text>
          </Pressable>
          <Text style={styles.topBarTitle}>Adicionar Local</Text>
          <View style={styles.iconPlaceholder} />
        </View>

        <ScrollView contentContainerStyle={styles.formContent}>
          <Pressable
            style={styles.miniMap}
            onLayout={(event) => {
              setMiniMapSize({
                width: event.nativeEvent.layout.width,
                height: event.nativeEvent.layout.height,
              });
            }}
            onPress={(event) => {
              const { locationX, locationY } = event.nativeEvent;
              updatePin(locationX / miniMapSize.width, locationY / miniMapSize.height);
            }}
          >
            <Text style={styles.miniMapHint}>Toca no mapa para ajustar o pin</Text>
            <View
              style={[
                styles.pin,
                {
                  left: `${newLocation.x * 100}%`,
                  top: `${newLocation.y * 100}%`,
                },
              ]}
            >
              <Text style={styles.pinText}>📍</Text>
            </View>
          </Pressable>

          <Text style={styles.fieldLabel}>Nome do local *</Text>
          <TextInput
            style={[styles.input, formErrors.name ? styles.inputError : null]}
            placeholder="ex: Ecoponto Rua Nova"
            value={newLocation.name}
            onChangeText={(value) =>
              setNewLocation((current) => ({ ...current, name: value }))
            }
          />
          {formErrors.name ? <Text style={styles.errorText}>{formErrors.name}</Text> : null}

          <Text style={styles.fieldLabel}>Tipo(s) de resíduo *</Text>
          <View style={styles.chipsWrap}>
            {FILTERS.filter((item) => item !== 'Todos').map((type) => {
              const selected = newLocation.types.includes(type);
              return (
                <Pressable
                  key={type}
                  onPress={() => toggleType(type)}
                  style={[styles.filterChip, selected ? styles.filterChipActive : null]}
                >
                  <Text style={selected ? styles.filterChipTextActive : styles.filterChipText}>
                    {type}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {formErrors.types ? <Text style={styles.errorText}>{formErrors.types}</Text> : null}

          <Text style={styles.fieldLabel}>Morada</Text>
          <TextInput
            style={[styles.input, styles.inputAddress]}
            editable={false}
            value={newLocation.address}
            accessibilityLabel={`Morada preenchida automaticamente: ${newLocation.address}`}
          />

          <Text style={styles.fieldLabel}>Foto (opcional)</Text>
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoPlaceholderText}>{newLocation.photoLabel}</Text>
          </View>
        </ScrollView>

        <Pressable style={styles.primaryButton} onPress={() => submitNewLocation({ forceDuplicate: false })}>
          <Text style={styles.primaryButtonText}>✔ Submeter para revisão</Text>
        </Pressable>

        {duplicateCandidate ? (
          <View style={styles.dialogBackdrop}>
            <View style={styles.duplicateDialog}>
              <View style={styles.duplicateHeader}>
                <Text style={styles.duplicateHeaderText}>⚠️ Local já existente?</Text>
              </View>
              <Text style={styles.dialogText}>
                Encontrámos um ponto a {duplicateDistanceMeters} m:
              </Text>
              <View style={styles.duplicateCard}>
                <Text style={styles.duplicateCardText}>
                  ♻ {duplicateCandidate.name} — {duplicateCandidate.types.join(' · ')} · Verificado ✓
                </Text>
              </View>
              <Text style={styles.dialogText}>
                Queres sugerir uma edição ao local existente em vez de criar um novo?
              </Text>
              <Pressable
                style={[styles.primaryButton, styles.dialogButton]}
                onPress={() => {
                  setNewLocation((current) => ({
                    ...current,
                    name: duplicateCandidate.name,
                    types: duplicateCandidate.types,
                    x: duplicateCandidate.x,
                    y: duplicateCandidate.y,
                    address: 'Rua das Flores, 10, Porto',
                  }));
                  setDuplicateCandidate(null);
                  setDuplicateDistanceMeters(null);
                }}
              >
                <Text style={styles.primaryButtonText}>✏️ Sugerir edição ao existente</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setDuplicateCandidate(null);
                  setDuplicateDistanceMeters(null);
                  submitNewLocation({ forceDuplicate: true });
                }}
              >
                <Text style={styles.dialogSecondaryAction}>É diferente, continuar mesmo assim</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.app}>
      <StatusBar style="dark" />
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>♻ EcoMap</Text>
        <Text style={styles.searchIcon}>⌕</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersRow}
      >
        {FILTERS.map((chip) => {
          const selected = filter === chip;
          return (
            <Pressable
              key={chip}
              onPress={() => setFilter(chip)}
              style={[styles.filterChip, selected ? styles.filterChipActive : null]}
            >
              <Text style={selected ? styles.filterChipTextActive : styles.filterChipText}>{chip}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={[styles.mapArea, !locationEnabled ? styles.mapDisabled : null]}>
        <View pointerEvents="none" style={styles.mapBackground}>
          <View style={styles.mapParkPatch} />
          <View style={[styles.mapRoad, styles.mapRoadMain]} />
          <View style={[styles.mapRoad, styles.mapRoadSecondary]} />
          <View style={[styles.mapRoad, styles.mapRoadDiagonal]} />
          <View style={styles.mapRoundabout} />
          <View style={[styles.mapBlock, styles.mapBlockOne]} />
          <View style={[styles.mapBlock, styles.mapBlockTwo]} />
          <View style={[styles.mapBlock, styles.mapBlockThree]} />
          <View style={styles.mapWater} />
        </View>
        <View style={styles.userDot} />
        {visiblePoints.map((point) => (
          <Pressable
            key={point.id}
            onPress={() => setSelectedPointId(point.id)}
            style={[
              styles.marker,
              {
                left: `${point.x * 100}%`,
                top: `${point.y * 100}%`,
                backgroundColor: point.status === 'pending' ? '#E65100' : '#2E7D32',
                borderWidth: selectedPointId === point.id ? 3 : 0,
              },
            ]}
          >
            <Text style={styles.markerText}>♻</Text>
          </Pressable>
        ))}

        {!locationEnabled ? (
          <View style={styles.dialogBackdrop}>
            <View style={styles.locationDialog}>
              <Text style={styles.locationDialogTitle}>📍 Localização desativada</Text>
              <Text style={styles.dialogText}>
                Ativa a localização para veres pontos de reciclagem perto de ti.
              </Text>
              <Pressable style={styles.locationButton} onPress={() => setLocationEnabled(true)}>
                <Text style={styles.locationButtonText}>Ativar Localização</Text>
              </Pressable>
              <Text style={styles.orDivider}>— ou pesquisa por morada —</Text>
              <TextInput
                style={styles.input}
                placeholder="🔍 Rua, cidade ou código postal..."
                value={searchAddress}
                onChangeText={setSearchAddress}
              />
              <Pressable style={styles.searchButton} onPress={searchByAddress}>
                <Text style={styles.searchButtonText}>Pesquisar</Text>
              </Pressable>
              {searchError ? <Text style={styles.errorText}>{searchError}</Text> : null}
            </View>
          </View>
        ) : null}
      </View>

      {selectedPoint ? (
        <View style={styles.bottomSheet}>
          <View style={styles.sheetTopRow}>
            <Text style={styles.sheetTitle}>♻ {selectedPoint.name}</Text>
            <View style={styles.distanceChip}>
              <Text style={styles.distanceChipText}>{selectedPoint.distance} m</Text>
            </View>
          </View>
          <View style={styles.chipsWrap}>
            {selectedPoint.types.map((type) => (
              <View key={type} style={styles.smallTypeChip}>
                <Text style={styles.smallTypeChipText}>{type}</Text>
              </View>
            ))}
          </View>
          <View style={styles.sheetActions}>
            <Pressable style={styles.primarySmallButton}>
              <Text style={styles.primarySmallButtonText}>Como chegar</Text>
            </Pressable>
            <Pressable style={styles.secondarySmallButton}>
              <Text style={styles.secondarySmallButtonText}>Detalhes</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <Pressable style={styles.fab} onPress={openAddLocation}>
        <Text style={styles.fabText}>＋</Text>
      </Pressable>

      {!locationEnabled ? (
        <Pressable style={styles.helperButton} onPress={() => setLocationEnabled(true)}>
          <Text style={styles.helperButtonText}>Simular GPS ligado</Text>
        </Pressable>
      ) : (
        <Pressable style={styles.helperButton} onPress={() => setLocationEnabled(false)}>
          <Text style={styles.helperButtonText}>Simular GPS desligado</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  topBar: {
    paddingTop: 52,
    paddingHorizontal: 18,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  topBarTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1B4332',
  },
  searchIcon: {
    fontSize: 24,
    color: '#1565C0',
  },
  iconPlaceholder: {
    width: 24,
  },
  backText: {
    fontSize: 24,
    color: '#1565C0',
  },
  filtersRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  filtersScroll: {
    maxHeight: 68,
    backgroundColor: '#fff',
  },
  filterChip: {
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#BFC8D4',
    backgroundColor: '#fff',
    marginRight: 8,
    justifyContent: 'center',
    alignSelf: 'center',
  },
  filterChipActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  filterChipText: {
    color: '#1C2A3A',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  mapArea: {
    flex: 1,
    margin: 12,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#DCE8D6',
    borderWidth: 1,
    borderColor: '#c6dbcd',
  },
  mapDisabled: {
    opacity: DISABLED_MAP_OPACITY,
  },
  mapBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#D9E6D4',
  },
  mapParkPatch: {
    position: 'absolute',
    width: '48%',
    height: '38%',
    left: '4%',
    top: '10%',
    borderRadius: 14,
    backgroundColor: '#C9DFC2',
  },
  mapRoad: {
    position: 'absolute',
    backgroundColor: '#EEF2F7',
    borderColor: '#D2D9E4',
    borderWidth: 1,
  },
  mapRoadMain: {
    width: '120%',
    height: 36,
    top: '55%',
    left: '-10%',
  },
  mapRoadSecondary: {
    width: 34,
    height: '120%',
    top: '-10%',
    left: '58%',
  },
  mapRoadDiagonal: {
    width: '110%',
    height: 28,
    left: '-8%',
    top: '26%',
    transform: [{ rotate: '-12deg' }],
  },
  mapRoundabout: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 999,
    borderWidth: 10,
    borderColor: '#E8EDF4',
    backgroundColor: '#D1E2CC',
    right: '14%',
    top: '42%',
  },
  mapBlock: {
    position: 'absolute',
    borderRadius: 8,
    backgroundColor: '#EEDFC8',
    borderWidth: 1,
    borderColor: '#D8C3A4',
  },
  mapBlockOne: {
    width: 72,
    height: 50,
    left: '12%',
    top: '63%',
  },
  mapBlockTwo: {
    width: 56,
    height: 46,
    left: '44%',
    top: '17%',
  },
  mapBlockThree: {
    width: 64,
    height: 52,
    right: '8%',
    bottom: '12%',
  },
  mapWater: {
    position: 'absolute',
    width: '32%',
    height: '24%',
    right: '-6%',
    top: '8%',
    borderRadius: 20,
    backgroundColor: '#BFE3F7',
    borderWidth: 1,
    borderColor: '#95C9E8',
  },
  mapStreetLabel: {
    position: 'absolute',
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  mapStreetLabelMain: {
    top: '58%',
    left: '14%',
  },
  mapStreetLabelSecondary: {
    top: '24%',
    left: '62%',
  },
  userDot: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 14,
    height: 14,
    marginLeft: -7,
    marginTop: -7,
    borderRadius: 999,
    backgroundColor: '#1565C0',
    borderWidth: 2,
    borderColor: '#fff',
  },
  marker: {
    position: 'absolute',
    width: 34,
    height: 34,
    marginLeft: -17,
    marginTop: -17,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#E8F4EA',
  },
  markerText: {
    color: '#fff',
    fontSize: 16,
  },
  bottomSheet: {
    marginHorizontal: 12,
    marginBottom: 72,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E3E7EE',
  },
  sheetTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sheetTitle: {
    flex: 1,
    fontWeight: '700',
    color: '#1E293B',
  },
  distanceChip: {
    marginLeft: 10,
    borderRadius: 999,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  distanceChipText: {
    color: '#2E7D32',
    fontWeight: '700',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  smallTypeChip: {
    borderWidth: 1,
    borderColor: '#C7D1DF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  smallTypeChipText: {
    color: '#334155',
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  primarySmallButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#2E7D32',
    borderRadius: 10,
    alignItems: 'center',
  },
  primarySmallButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  secondarySmallButton: {
    flex: 1,
    paddingVertical: 10,
    borderColor: '#2E7D32',
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondarySmallButtonText: {
    color: '#2E7D32',
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    width: 58,
    height: 58,
    borderRadius: 999,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  fabText: {
    color: '#fff',
    fontSize: 30,
    marginTop: -2,
  },
  helperButton: {
    position: 'absolute',
    left: 18,
    bottom: 24,
    backgroundColor: '#0050AA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  helperButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  formContent: {
    padding: 14,
    paddingBottom: 30,
  },
  miniMap: {
    height: 180,
    borderRadius: 14,
    backgroundColor: '#E9F4E6',
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D0DFD2',
  },
  miniMapHint: {
    padding: 10,
    color: '#48625B',
    fontWeight: '500',
  },
  pin: {
    position: 'absolute',
    marginLeft: -11,
    marginTop: -22,
  },
  pinText: {
    fontSize: 22,
  },
  fieldLabel: {
    marginTop: 8,
    marginBottom: 6,
    fontWeight: '600',
    color: '#1F2937',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  inputAddress: {
    borderColor: '#2E7D32',
    backgroundColor: '#F0FAF1',
    color: '#2E7D32',
  },
  inputError: {
    borderColor: '#C62828',
  },
  photoPlaceholder: {
    marginTop: 2,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  photoPlaceholderText: {
    color: '#64748B',
    fontWeight: '500',
  },
  primaryButton: {
    margin: 14,
    marginTop: 0,
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  dialogBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  locationDialog: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  locationDialogTitle: {
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 10,
    color: '#C62828',
  },
  dialogText: {
    color: '#334155',
    marginBottom: 10,
    lineHeight: 20,
  },
  locationButton: {
    backgroundColor: '#1565C0',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 11,
    marginBottom: 8,
  },
  locationButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  orDivider: {
    textAlign: 'center',
    color: '#64748B',
    marginBottom: 8,
  },
  searchButton: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#2E7D32',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 11,
  },
  searchButtonText: {
    color: '#2E7D32',
    fontWeight: '700',
  },
  errorText: {
    color: '#C62828',
    marginTop: 6,
    fontWeight: '600',
  },
  duplicateDialog: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E65100',
    overflow: 'hidden',
  },
  duplicateHeader: {
    backgroundColor: '#FFF3E0',
    padding: 12,
  },
  duplicateHeaderText: {
    color: '#A84B00',
    fontSize: 17,
    fontWeight: '700',
  },
  duplicateCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CEE6D2',
    backgroundColor: '#F2FBF3',
    padding: 10,
    marginBottom: 10,
  },
  duplicateCardText: {
    color: '#1B4332',
    fontWeight: '600',
  },
  dialogButton: {
    marginHorizontal: 12,
    marginBottom: 12,
  },
  dialogSecondaryAction: {
    textAlign: 'center',
    color: '#475569',
    fontWeight: '600',
    marginBottom: 14,
  },
});
