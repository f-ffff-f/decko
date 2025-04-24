import { useSnapshot } from 'valtio'
import { deckoState, IState } from './state' // state 파일 경로는 실제 프로젝트에 맞게 조정하세요.

// SafePathValue 입 (기존과 동일)
type SafePathValue<
  T,
  P extends ReadonlyArray<string | number>
> = P extends readonly []
  ? T
  : P extends readonly [infer K, ...infer Rest]
  ? K extends keyof T
    ? T[K] extends infer NextVal
      ? Rest extends ReadonlyArray<string | number>
        ? SafePathValue<NextVal, Rest>
        : never
      : never
    : K extends number
    ? T extends ReadonlyArray<infer U>
      ? Rest extends ReadonlyArray<string | number>
        ? SafePathValue<U, Rest>
        : never
      : undefined // K는 숫자인데 T는 배열이 아님
    : undefined // K가 T의 키도 아니고 숫자도 아님
  : never // 경로 P가 유효한 형태가 아님

type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, ...0[]]
export type ValidPaths<T, D extends number = 5> = [D] extends [never]
  ? never
  : T extends
      | string
      | number
      | boolean
      | bigint
      | symbol
      | undefined
      | null
      | Date
      | Function
  ? []
  : T extends ReadonlyArray<infer U>
  ?
      | [number]
      | (ValidPaths<U, Prev[D]> extends infer Nested
          ? Nested extends ReadonlyArray<string | number>
            ? [number, ...Nested]
            : never
          : never)
  : T extends object
  ? {
      [K in keyof T]-?: K extends string | number
        ?
            | [K]
            | (ValidPaths<T[K], Prev[D]> extends infer Nested
                ? Nested extends ReadonlyArray<string | number>
                  ? [K, ...Nested]
                  : never
                : never)
        : never
    }[keyof T]
  : []

type DeckoStatePaths = ValidPaths<IState>

/**
 * Valtio 스냅샷에서 깊은 경로의 값을 타입 안전하게 가져오는 커스텀 훅.
 * 경로 자동 완성 및 컴파일 시점 검증 기능을 제공합니다.
 * ValidPaths<IState>에 의해 유효성이 검증된 경로에 대해서는 NonNullable 타입을 반환합니다.
 *
 * @template P - IState 내의 유효한 경로 튜플 타입. ValidPaths<IState> 유니온에 속해야 함.
 * @param path - 객체 내 속성에 접근하기 위한 경로 배열 (튜플). 자동 완성 및 검증 대상.
 * @returns 경로에 해당하는 값. NonNullable<SafePathValue<IState, P>> 타입으로, undefined가 제외됩니다.
 * (주의: 런타임에 실제로 값이 undefined일 경우 타입과 불일치할 수 있습니다.)
 */
export const useDeckoSnapshot = <P extends DeckoStatePaths>(
  path: P & ReadonlyArray<string | number>
  // --- 변경된 부분 ---
): NonNullable<SafePathValue<IState, P>> => {
  const snapshot = useSnapshot(deckoState) as IState

  let current: any = snapshot
  for (const key of path) {
    // 런타임 체크는 여전히 필요합니다.
    // 만약 이 부분이 실행되면, 실제 반환값은 undefined이지만 타입은 NonNullable이므로
    // 호출하는 쪽에서 타입 에러 없이 런타임 에러가 발생할 수 있습니다.
    if (current === null || typeof current !== 'object') {
      // 타입 시스템은 NonNullable을 기대하지만, 실제로는 undefined를 반환하게 됨.
      // undefined를 unknown으로 먼저 변환 후 최종 타입으로 단언
      return undefined as unknown as NonNullable<SafePathValue<IState, P>>
    }
    current = current[key]
    if (current === undefined) {
      // undefined를 unknown으로 먼저 변환 후 최종 타입으로 단언
      return undefined as unknown as NonNullable<SafePathValue<IState, P>>
    }
  }

  // --- 변경된 부분 ---
  // 최종 반환 시 NonNullable 타입으로 단언합니다.
  // 컴파일 시점에 경로 P가 유효하다고 판단했으므로, 개발자는 결과가 undefined가 아님을 가정합니다.
  return current as NonNullable<SafePathValue<IState, P>>
}

// --- 예시 사용법 ---
/*
interface MyState {
  user?: {
    name: string;
    address: {
      city: string;
      zip?: number;
    }
  };
  items: string[];
}

// 가상의 state와 IState 정의
const deckoState = {} as MyState;
type IState = MyState;

function MyComponent() {
  // 경로 ['user', 'name'] 은 ValidPaths<MyState>에 속함
  // SafePathValue<MyState, ['user', 'name']> 는 string | undefined 임 (user가 optional 이므로)
  // NonNullable<SafePathValue<MyState, ['user', 'name']>> 는 string 임
  const userName = useDeckoSnapshot(['user', 'name']); // 타입: string (컴파일러는 undefined 가능성을 무시)
  console.log(userName.toUpperCase()); // 타입 에러 없음. 하지만 런타임에 user가 없으면 에러 발생!

  // 경로 ['items', 0] 은 ValidPaths<MyState>에 속함
  // SafePathValue<MyState, ['items', 0]> 는 string | undefined 임 (배열이 비어있을 수 있으므로)
  // NonNullable<SafePathValue<MyState, ['items', 0]>> 는 string 임
  const firstItem = useDeckoSnapshot(['items', 0]); // 타입: string (컴파일러는 undefined 가능성을 무시)

  // 경로 ['user', 'address', 'zip'] 는 ValidPaths<MyState>에 속함
  // SafePathValue<MyState, ['user', 'address', 'zip']> 는 number | undefined 임 (zip이 optional)
  // NonNullable<SafePathValue<MyState, ['user', 'address', 'zip']>> 는 number 임
  const zipCode = useDeckoSnapshot(['user', 'address', 'zip']); // 타입: number (컴파일러는 undefined 가능성을 무시)

  // 경로 ['invalid', 'path'] 는 ValidPaths<MyState>에 속하지 않으므로 컴파일 에러 발생
  // const invalid = useDeckoSnapshot(['invalid', 'path']);

  return <div>...</div>;
}
*/
