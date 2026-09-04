#!/usr/bin/env python3
"""契约校验器：校验章节 JSON 是否符合 docs/AGENT_BRIEF.md §4 契约。用法: python3 tools/validate.py m01 m02 ..."""
import json, sys, re

plan = json.load(open('assets/data/_plan.json'))
all_ids = {p['id'] for c in plan['chapters'] for p in c['points']}
anim = {'sd-shift','slider-graph','ppf','budget-optimum','matrix-click','lorenz','ad-as','phillips'}
img = {'two-lines-intersection','flow-loop','bars','matrix'}
ok = True
for ch in sys.argv[1:]:
    try:
        d = json.load(open(f'assets/data/{ch}.json'))
        plan_pts = [p['id'] for p in next(c for c in plan['chapters'] if c['id']==ch)['points']]
        assert [p['id'] for p in d['points']] == plan_pts, 'id 顺序不符'
        nc = nf = empty = 0
        for p in d['points']:
            for k in ['id','title','l1','case','l2','l3','animation','quiz','links','references']:
                assert p.get(k), (p['id'], k)
            for k in ['definition','analogy','image']: assert p['l1'].get(k), (p['id'],'l1.'+k)
            assert p['l1']['image']['type'] in img, (p['id'],'image type')
            assert p['animation']['type'] in anim, (p['id'],'anim type')
            assert all(p['case'].get(k) for k in ['event','facts','source_ref','explain']), (p['id'],'case')
            for k in ['derivation','exam_tips','pitfalls']: assert p['l2'].get(k), (p['id'],'l2.'+k)
            assert p['l2']['pitfalls'] and all('❌' in x and '✅' in x for x in p['l2']['pitfalls']), (p['id'],'pitfalls')
            assert p['l3'].get('math'), (p['id'],'l3')
            assert len(p['quiz'])==3 and [q['level'] for q in p['quiz']]==['L1','L2','L3'], (p['id'],'quiz levels')
            for q in p['quiz']:
                assert len(q['options'])==4 and isinstance(q['answer'],int) and 0<=q['answer']<4 and q.get('explain') and q.get('hint'), (p['id'],q['level'])
            nc+=1
            for f in p['frontier']:
                assert f.get('finding'), (p['id'],'frontier')
                if f['finding'].startswith('本节暂未纳入'): empty+=1
                else:
                    assert f.get('citation','').startswith('[') and '](http' in f.get('citation',''), (p['id'],'citation 格式')
                    nf+=1
            for side in ['prev','next']:
                for l in p['links'][side]:
                    assert l.split('|')[0] in all_ids, (p['id'],side,l)
            assert p['references'] and all('](http' in r for r in p['references']), (p['id'],'references')
            assert p['case']['source_ref'] in p['references'], (p['id'],'case ref 不在 references')
        nref = sum(len(p['references']) for p in d['points'])
        print(f'{ch}: OK  知识点={nc} 案例={nc} 前沿(真实)={nf} 前沿(空态)={empty} references={nref}')
    except Exception as e:
        ok = False
        print(f'{ch}: FAIL — {e}')
sys.exit(0 if ok else 1)
