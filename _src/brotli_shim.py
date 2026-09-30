"""Tiny ctypes shim around the system libbrotli, enough for fontTools' WOFF2 writer."""
import ctypes, ctypes.util
_enc = ctypes.CDLL('libbrotlienc.so.1')
_dec = ctypes.CDLL('libbrotlidec.so.1')
MODE_GENERIC, MODE_TEXT, MODE_FONT = 0, 1, 2
_enc.BrotliEncoderMaxCompressedSize.restype = ctypes.c_size_t
_enc.BrotliEncoderMaxCompressedSize.argtypes = [ctypes.c_size_t]
_enc.BrotliEncoderCompress.argtypes = [ctypes.c_int, ctypes.c_int, ctypes.c_int, ctypes.c_size_t, ctypes.c_char_p, ctypes.POINTER(ctypes.c_size_t), ctypes.c_char_p]
_dec.BrotliDecoderDecompress.argtypes = [ctypes.c_size_t, ctypes.c_char_p, ctypes.POINTER(ctypes.c_size_t), ctypes.c_char_p]
class error(Exception): pass
def compress(data, mode=MODE_GENERIC, quality=11, lgwin=22, lgblock=0):
    data = bytes(data)
    n = _enc.BrotliEncoderMaxCompressedSize(len(data)) or len(data) + 1024
    out = ctypes.create_string_buffer(n); size = ctypes.c_size_t(n)
    if not _enc.BrotliEncoderCompress(quality, lgwin, mode, len(data), data, ctypes.byref(size), out):
        raise error('compress failed')
    return out.raw[:size.value]
def decompress(data):
    data = bytes(data); n = max(1 << 20, len(data) * 20)
    while True:
        out = ctypes.create_string_buffer(n); size = ctypes.c_size_t(n)
        r = _dec.BrotliDecoderDecompress(len(data), data, ctypes.byref(size), out)
        if r == 1: return out.raw[:size.value]
        n *= 4
        if n > 1 << 28: raise error('decompress failed')
