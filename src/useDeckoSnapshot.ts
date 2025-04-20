import { useSnapshot } from 'valtio'
import { deckoState, IState } from './state'

type SafePathValue<
  T,
  P extends ReadonlyArray<string | number>
> = P extends readonly [] // 경로가 비었으면 T 반환 (재귀 종료 조건)
  ? T
  : P extends readonly [infer K, ...infer Rest] // 경로 첫 요소 K와 나머지 Rest 분리
  ? K extends keyof T // K가 T의 유효한 키인가?
    ? T[K] extends infer NextVal // T[K]의 타입 추론 (undefined 처리 위해)
      ? Rest extends ReadonlyArray<string | number> // Rest도 유효한 경로 배열인가?
        ? SafePathValue<NextVal, Rest> // 유효하면 다음 값(NextVal)과 나머지 경로(Rest)로 재귀 호출
        : never // Rest가 유효한 경로 배열이 아니면 never
      : never // T[K] 타입 추론 실패 (이론상 발생 어려움)
    : K extends number // K가 숫자인가? (배열 인덱스 가능성)
    ? T extends ReadonlyArray<infer U> // T가 배열인가? (요소 타입 U)
      ? Rest extends ReadonlyArray<string | number> // Rest 유효성 검사
        ? SafePathValue<U, Rest> // 배열 요소 타입(U)과 나머지 경로(Rest)로 재귀 호출
        : never
      : undefined // K는 숫자인데 T는 배열이 아님 => 경로 중간에서 undefined
    : undefined // K가 T의 키도 아니고 숫자도 아님 => 경로 중간에서 undefined
  : never // 경로 P가 유효한 형태가 아님

// 객체/배열의 모든 유효한 경로를 튜플의 유니온 형태로 생성하는 타입
// 재귀 깊이 제한(Depth)을 두어 무한 루프 및 성능 저하 방지
type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, ...0[]] // 깊이 제한용 헬퍼

export type ValidPaths<T, D extends number = 5> = [D] extends [never] // 기본 깊이 5 // 깊이 제한 도달 시 never 반환
  ? never
  : T extends  // T가 원시 타입, Date, 함수 등이면 경로 없음 ([])
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
  : T extends ReadonlyArray<infer U> // T가 배열일 경우
  ? // [number] 또는 [number, ...<배열 요소의 경로>] 형태
    | [number]
      | (ValidPaths<U, Prev[D]> extends infer Nested // 요소 타입 U로 재귀 호출
          ? Nested extends ReadonlyArray<string | number> // 재귀 결과가 경로 배열이면
            ? [number, ...Nested] // 현재 인덱스(number)와 결합
            : never // 아니면 잘못된 경로
          : never)
  : T extends object // T가 객체일 경우
  ? {
      // 객체의 각 키 K에 대해
      [K in keyof T]-?: K extends string | number // 키가 문자열이나 숫자인 경우만 처리
        ? // [K] 또는 [K, ...<K 속성값의 경로>] 형태
          | [K]
            | (ValidPaths<T[K], Prev[D]> extends infer Nested // 속성값 T[K]로 재귀 호출
                ? Nested extends ReadonlyArray<string | number> // 재귀 결과가 경로 배열이면
                  ? [K, ...Nested] // 현재 키(K)와 결합
                  : never // 아니면 잘못된 경로
                : never)
        : never // 키가 심볼 등 다른 타입이면 무시
    }[keyof T] // 모든 키에 대한 결과를 유니온으로 합침
  : [] // 위 모든 경우에 해당하지 않으면 경로 없음 ([])

type DeckoStatePaths = ValidPaths<IState>

/**
 * Valtio 스냅샷에서 깊은 경로의 값을 타입 안전하게 가져오는 커스텀 훅.
 * 경로 자동 완성 및 컴파일 시점 검증 기능을 제공합니다.
 *
 * @template P - IState 내의 유효한 경로 튜플 타입. ValidPaths<IState> 유니온에 속해야 함.
 * @param path - 객체 내 속성에 접근하기 위한 경로 배열 (튜플). 자동 완성 및 검증 대상.
 * @returns 경로에 해당하는 값. 경로가 유효하지 않거나 값이 없으면 타입 추론 결과에 따라 undefined가 포함될 수 있음.
 */

export const useDeckoSnapshot = <P extends DeckoStatePaths>(
  // path 매개변수의 타입을 P로 제한. P는 DeckoStatePaths 유니온 중 하나여야 함.
  path: P & ReadonlyArray<string | number> // P와 함께 실제 배열임을 명시
): SafePathValue<IState, P> => {
  // 반환 타입은 SafePathValue로 추론
  // 1. 스냅샷 가져오기
  const snapshot = useSnapshot(deckoState) as IState

  // 2. 경로 탐색 (런타임 로직은 이전과 동일)
  let current: any = snapshot
  for (const key of path) {
    if (current === null || typeof current !== 'object') {
      // 경로가 중간에 끊기면 SafePathValue<IState, P> 타입은 undefined를 포함하게 됨
      return undefined as SafePathValue<IState, P>
    }
    current = current[key]
    if (current === undefined) {
      // 경로 중간 또는 최종 값이 undefined인 경우
      return undefined as SafePathValue<IState, P>
    }
  }

  // 3. 최종 값 반환 (타입 단언)
  // SafePathValue<IState, P>가 반환 타입을 정확히 계산해주므로, current를 해당 타입으로 단언
  return current as SafePathValue<IState, P>
}
