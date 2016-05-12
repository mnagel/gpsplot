from unittest import TestCase
import preproc


class TestGpsPlot(TestCase):
    def test_get_parents(self):
        expected = ['/foo/bar', '/foo', '/']
        self.assertEquals(expected, preproc.ExifImage.get_parents("/foo/bar/bla.txt"))

if __name__ == '__main__':
    unittest.main()
